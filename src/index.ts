export default {
  async fetch(request: Request, env: any): Promise<Response> {

    // 🧪 логируем ВСЁ, что приходит
    console.log("🔥 REQUEST:", request.method);

    // 🌐 если открыли в браузере
    if (request.method !== "POST") {
      return new Response("bot is running");
    }

    let update: any;

    try {
      const raw = await request.text();
      console.log("📦 RAW UPDATE:", raw);

      update = JSON.parse(raw);
    } catch (e) {
      console.log("❌ BAD JSON");
      return new Response("bad request");
    }

    // 🧠 проверка структуры Telegram
    if (!update?.message?.chat?.id) {
      console.log("❌ NO MESSAGE");
      return new Response("no message");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    console.log("💬 MESSAGE:", text);

    // 🧩 логика бота
    let reply = "🤖 не понял команду";

    if (text === "/start") {
      reply = "🛒 бот магазина работает";
    }

    if (text === "/catalog") {
      reply = "📦 каталог:\n1. Товар A\n2. Товар B";
    }

    if (text === "/help") {
      reply = "команды: /start /catalog /help";
    }

    try {
      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      });

      console.log("✅ SENT MESSAGE");

    } catch (e) {
      console.log("❌ SEND ERROR", e);
    }

    return new Response("ok");
  }
};
