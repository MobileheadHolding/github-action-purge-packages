const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

const ghClient = new github.GitHub(process.env.GITHUB_TOKEN);
let owner, repo, daysOld, packageNameQuery, versionRegex, packageLimit, versionLimit;

const getVersionsToDelete = async () => {
    let edges = await ghClient.graphql(`{
        repository(owner: "${owner}", name:"${repo}"){
            packages(
                last: ${packageLimit}
                names: [${packageNameQuery}]
            ){
                edges{
                    node{
                        id, 
                        name, 
                        versions(last: ${versionLimit}){
                            edges {
                                node {
                                    id
                                    version
                                    files(first: 1) {
                                        nodes {
                                            updatedAt
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }`, {});

    edges = edges.repository.packages.edges;
    return edges
        .map(pkg => {
            return pkg.node.versions.edges.map(version => {
                const files = version.node.files ? version.node.files.nodes : [];
                const updatedAt = files.length > 0 ? files[0].updatedAt : ''
                return {
                    package: pkg.node.name,
                    id: version.node.id,
                    updatedAt: updatedAt,
                    version: version.node.version
                }
            });
        })
        .flat()
        .filter(version => version.updatedAt)
        .filter(version => {
            return versionRegex.test(version.version) && (new Date(version.updatedAt).getTime() <= new Date() - daysOld);
        });
};
const deleteVersion = async (version) => {
    return new Promise((resolve, reject) => {
        fetch(
            'https://api.github.com/graphql',
            {
                method: 'post',
                body: JSON.stringify({query: `mutation { deletePackageVersion(input:{packageVersionId:\"${version.id}\"}) { success }}`}),
                headers: {
                    'Accept': 'application/vnd.github.package-deletes-preview+json',
                    'Authorization': `bearer ${process.env.GITHUB_TOKEN}`
                },
            })
            .then(res => res.json())
            .then(json => {
                core.debug(JSON.stringify(json));
                resolve(json);
            })
            .catch(error => {
                core.setFailed(`failed to delete ${JSON.stringify(version)}: ${JSON.stringify(error.message)}`);
                reject();
            });
    })

};
const run = async () => {
    const context = await github.context;
    owner = core.getInput('owner') || context.payload.repository.full_name.split('/')[0];
    repo = core.getInput('repo') || context.payload.repository.full_name.split('/')[1];
    daysOld = core.getInput('days-old');
    packageNameQuery = core.getInput('package-name-query');
    packageLimit = core.getInput('package-limit');
    versionRegex = RegExp(core.getInput('version-regex'));
    versionLimit = core.getInput('version-limit');

    if (packageNameQuery) {
        packageNameQuery = packageNameQuery.split(',').map(str => `"${str}"`).join(',')
    }

    let versionsToDelete = await getVersionsToDelete();
    let deletedVersions = [];
    for (const version of versionsToDelete) {
        core.debug(`will try to delete ${JSON.stringify(version)}`);
        await deleteVersion(version);
        deletedVersions.push(`${version.package}@${version.version}`);
    }
    core.setOutput('deletedVersions', deletedVersions.join(','));
};

run();
