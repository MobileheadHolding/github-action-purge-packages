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
        owner = core.getInput('owner');
        repo = core.getInput('repo');
        daysOld = core.getInput('days-old');
        packageNameRegex = core.getInput('package-name-regex');
        versionRegex = core.getInput('version-regex');

        console.log(github.context);
        let versions = getVersionsToDelete();

        core.setOutput("success", "true");
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();