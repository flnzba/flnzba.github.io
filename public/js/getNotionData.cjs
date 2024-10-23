const { Client } = require("@notionhq/client")

// Initializing a client
const notion = new Client({
	auth: import.meta.env.VITE_NOTION_TOKEN,
})

const getUsers = async () => {
	const listUsersResponse = await notion.users.list({})
	console.log(listUsersResponse)
}

console.log(process.env.NOTION_TOKEN)
// getUsers()
