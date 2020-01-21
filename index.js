const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

const ghClient = new github.GitHub(process.env.GITHUB_TOKEN);
let owner, repo, daysOld, packageNameQuery, versionRegex, packageLimit, versionLimit;

const getVersionsToDelete = async () => {
    let edges = await ghClient.graphql(`{
        repository(owner: "${owner}", name:"${repo}"){
            registryPackagesForQuery(
                last: ${packageLimit},
                query: "${packageNameQuery}",
            ){
                edges{
                    node{
                        id, 
                        name, 
                        versions(last: ${versionLimit}){
                            edges {
                                node {
                                    id, 
                                    updatedAt, 
                                    version
                                }
                            }
                        }
                    }
                }
            }
        }
    }`, {});
    edges = edges.repository.registryPackagesForQuery.edges;
    return edges
        .map(registryPackage => {
            return registryPackage.node.versions.edges.map(version => {
                return {
                    id: version.node.id,
                    updatedAt: version.node.updatedAt,
                    version: version.node.version,
                    package: registryPackage.node.name
                }
            });
        })
        .flat()
        .filter(version => {
            return versionRegex.test(version.version) && (new Date(version.updatedAt).getTime() <= new Date() - daysOld);
        });
};
const deleteVersion = async (versionId) => {
    return new Promise((resolve, reject) => {
        fetch(
            'https://api.github.com/graphql',
            {
                method: 'post',
                body: JSON.stringify({
                    query: `{"query":"mutation { deletePackageVersion(input:{packageVersionId:\"${versionId}\"}) { success }}"}`
                }),
                headers: {
                    'Accept': 'application/vnd.github.package-deletes-preview+json',
                    'Authorization': `bearer ${process.env.GITHUB_TOKEN}`
                },
            })
            .then(res => res.json())
            .then(json => {
                console.log(json);
                resolve(json)
            });
    })

};
const run = async () => {
    try {
        const context = await github.context;
        owner = core.getInput('owner') || context.payload.repository.full_name.split('/')[0];
        repo = core.getInput('repo') || context.payload.repository.full_name.split('/')[1];
        daysOld = core.getInput('days-old');
        packageNameQuery = core.getInput('package-name-query');
        packageLimit = core.getInput('package-limit');
        versionRegex = RegExp(core.getInput('version-regex'));
        versionLimit = core.getInput('version-limit');
        let versionsToDelete = await getVersionsToDelete();
        console.log(versionsToDelete);
        core.setOutput("success", "true");
        await versionsToDelete.map(version => {
            return deleteVersion(version.id);
        });
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();