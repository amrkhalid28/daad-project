const https = require('https');

module.exports = async (req, res) => {
    // 1. إعدادات السماح (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // ⚠️⚠️ ضع مفتاح API الخاص بك هنا مباشرة بين علامات التنصيص ⚠️⚠️
        const apiKey = "AIzaSyAZcDET8R3752vyMO3EfPfKShyvYEt2_j4"; 

        if (!apiKey || apiKey.includes("xxxx")) {
            return res.status(200).json({ text: "⚠️ خطأ: يرجى وضع مفتاح API في الكود (السطر 15)." });
        }

        // 2. قراءة البيانات
        const body = req.body || {};
        const { history = [], clientInfo = {}, isFirstRun = false } = body;

        // 3. إعداد الرسالة
        const systemPrompt = `
            أنت "مساعد ض" (Daad Assistant)، المستشار الذكي لشركة "ضاد".
            بيانات العميل: ${JSON.stringify(clientInfo)}
            تحدث بلهجة سعودية مهنية.
            ${isFirstRun ? "ابدأ بالتحليل والترحيب." : ""}
        `;

        let contents = [{ role: "user", parts: [{ text: systemPrompt }] }];
        if (history.length > 0) contents = contents.concat(history.slice(-4));

        const postData = JSON.stringify({
            contents: contents,
            generationConfig: { temperature: 0.7 }
        });

        // 4. الاتصال بـ Gemini Pro
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const responseText = await new Promise((resolve, reject) => {
            const request = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => resolve(data));
            });
            request.on('error', (e) => reject(e));
            request.write(postData);
            request.end();
        });

        const jsonResponse = JSON.parse(responseText);
        
        if (jsonResponse.error) {
             return res.status(200).json({ text: `⚠️ خطأ جوجل: ${jsonResponse.error.message}` });
        }

        const replyText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم يصل رد.";
        return res.status(200).json({ text: replyText });

    } catch (error) {
        return res.status(200).json({ text: `⚠️ خطأ سيرفر: ${error.message}` });
    }
};
