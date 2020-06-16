1. Clone this repo: https://github.com/junaid33/ks-error-repro
2. Add local postgres connection URL to .env
3. npm install, npm run create-tables, npm run dev
4. Go to localhost:3000/admin/graphql
5. Enter this to create a user:

mutation {
createUser(
data: {
name: "Keystone"
email: "admin@keystonejs.com"
password: "password"
}
) {
id
name
email
}
}

6. Log into localhost:3000/admin using created log-in.
7. Click on OrderItem, ChannelItem, and Match and you will see errors
