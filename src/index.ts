const BOT_TOKEN = "8691254747:AAHTjhxn3LhMQsg54dkkX2aMTQw2gfPr6Ug";

export default {
  async fetch(request: Request): Promise<Response> {

    if (request.method !== "POST") {
      return new Response("WORKER HIT");
    }

    let update: any;

    try {
      update = await request.json();
    } catch {
      return new Response("bad json");
    }

    const msg = update.message;
    if (!msg?.chat?.id) return new Response("no message");

    const chatId = msg.chat.id;
    const text = msg.text || "";

    // 📌 /start с фото
    if (text === "/start") {

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,

          // 🖼️ замени на свою картинку
          photo: "https://ibb.co/tPncNfsM",

          caption:
            "👋 Добро пожаловать в магазин!\n" +
            "💎 Здесь ты можешь купить товары\n\n" +
            "👇 выбери действие",

          reply_markup: {
            inline_keyboard: [
              [
                { text: "📦 Каталог", callback_data: "catalog" }
              ]
            ]
          }
        })
      });

      return new Response("ok");
    }

    // 📦 простой ответ на каталог (чтобы кнопка не молчала)
    if (update.callback_query?.data === "catalog") {

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "📦 Каталог пока в разработке"
        })
      });

      return new Response("ok");
    }

    return new Response("ok");
  }
};
