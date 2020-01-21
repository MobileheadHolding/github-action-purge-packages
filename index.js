const core = require('@actions/core');
const github = require('@actions/github');

const ghClient = new github.GitHub(process.env.GITHUB_TOKEN);
let owner, repo, daysOld, packageNameRegex, versionRegex, packageLimit, versionLimit;

const getVersionsToDelete = async () => {
    const versionsQuery =
    `{
        repository(owner: "${owner}", name:"${repo}"){
            registryPackagesForQuery(
                last: ${packageLimit},
                query: "${packageNameRegex}",
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
    return await ghClient.graphql(versionsQuery, {});
};
const run = async () => {
    try {
        const context = await github.context;
        owner = core.getInput('owner') || context.payload.repository.full_name.split('/')[0];
        repo = core.getInput('repo') || context.payload.repository.full_name.split('/')[1];
        daysOld = core.getInput('days-old');
        packageNameRegex = core.getInput('package-name-regex');
        packageLimit = core.getInput('package-limit');
        versionRegex = core.getInput('version-regex');
        versionLimit = core.getInput('version-limit');
        console.log(`owner: ${owner} repo: ${repo}`);
        let versions = getVersionsToDelete();
        core.setOutput("success", "true");
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();