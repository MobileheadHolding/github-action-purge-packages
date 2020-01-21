const core = require('@actions/core');
const github = require('@actions/github');

const ghClient = new github.GitHub(process.env.GITHUB_TOKEN);
let owner, repo, daysOld, packageNameQuery, versionRegex, packageLimit, versionLimit;

const getVersionsToDelete = async () => {
    const versionsQuery =
        `{
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
    }`;
    let edges = await ghClient.graphql(versionsQuery, {});
    edges = edges.repository.registryPackagesForQuery.edges;
    let versions = edges
        .map(package => {
            return package.node.versions.edges.map(version => {
                return {
                    id: version.node.id,
                    updatedAt: version.node.updatedAt,
                    version: version.node.version,
                    package: package.node.name
                }
            });
        })
        .flat()
        .filter(version => {
            return versionRegex.test(version.version);
        });
    console.log(JSON.stringify(versions));
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
        console.log(`owner: ${owner} repo: ${repo}`);
        let versions = getVersionsToDelete();
        core.setOutput("success", "true");
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();