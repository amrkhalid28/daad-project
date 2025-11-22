const https = require('https');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(200).json({ text: "⚠️ خطأ: مفتاح API مفقود." });

        const body = req.body;
        const { history = [], clientInfo = {}, isFirstRun = false } = body;

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

        // *** نستخدم gemini-pro هنا في الملف الجديد ***
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
}
```
6.  اضغط **Commit changes**.

---

### الخطوة 2: توجيه الموقع للملف الجديد 🔄
الآن سنخبر ملف `index.html` أن يترك الملف القديم ويتحدث مع الجديد `chat_v2`.

1.  ارجع للصفحة الرئيسية للمشروع على **GitHub**.
2.  اضغط على ملف **`index.html`**.
3.  اضغط علامة القلم ✏️.
4.  ابحث (Ctrl+F) عن كلمة: `getChatReply`.
5.  ستجدها داخل دالة اسمها `callAssistant` وأخرى اسمها `sendChatMessage` وغيرها.
6.  استبدل أي كلمة `getChatReply` تجدها بـ **`chat_v2`**.

    * السطر سيكون هكذا:
        ```javascript
        const res = await fetch('/api/chat_v2', { ...
