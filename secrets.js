// Import the Secret Manager client and instantiate it:
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// parent = 'projects/my-project', // Project for which to manage secrets.
// secretId = 'foo', // Secret ID.
// payload = 'hello world!' // String source data.


exports.getStripeKey = getStripeKey;


async function getStripeKey() {
    // Access the secret.
    const [accessResponse] = await client.accessSecretVersion({
        name: "projects/385511621178/secrets/Stripe_Secret_Key/versions/1",
    });

    const stripe_secret_key = accessResponse.payload.data.toString('utf8');
    console.log("hi")
    // console.log(stripe_secret_key)
    return stripe_secret_key
}


