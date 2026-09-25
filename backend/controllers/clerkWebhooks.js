import { Webhook } from "svix";
import { inngest } from "../inngest/index.js";

const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        await whook.verify(JSON.stringify(req.body), headers)

        const { data, type } = req.body

        await inngest.send({
            name: `clerk/${type}`,
            data,
        })

        res.json({ success: true, message: "Webhook Received" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

export default clerkWebhooks;
