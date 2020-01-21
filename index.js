const core = require('@actions/core');
const github = require('@actions/github');

const ghClient = new github.GitHub(process.env.GITHUB_TOKEN);
let owner, repo, daysOld, packageNameRegex, versionRegex;

const getVersionsToDelete = async () => {
    const versionsQuery =
            `query {
                repository(owner: "${owner}", name:"${repo}"){
                    registryPackagesForQuery(
                        query: "${packageNameRegex}",
                    ){
                        edges{
                            node{
                                id, 
                                name, 
                                versions{
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
            }`
    ;
    const versionsResult = await ghClient.graphql(versionsQuery, {});
    console.log(versionsResult);
    return versionsResult;
};
const run = async () =>  {
    try {
        const context = await github.context;
        owner = core.getInput('owner') || context.payload.repository.full_name.split('/')[0];
        repo = core.getInput('repo') || context.payload.repository.full_name.split('/')[1];
        daysOld = core.getInput('days-old');
        packageNameRegex = core.getInput('package-name-regex');
        versionRegex = core.getInput('version-regex');
        console.log(`owner: ${owner} repo: ${repo}`);
        let versions = getVersionsToDelete();

        core.setOutput("success", "true");
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();