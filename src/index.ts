export default {
  async fetch(request: Request, env: any): Promise<Response> {

    // 🔒 защита от браузера (GET-запросы)
    if (request.method !== "POST") {
      return new Response("bot is running");
    }

    let update: any;

    // 📩 пытаемся прочитать JSON от Telegram
    try {
      update = await request.json();
    } catch (e) {
      return new Response("bad request");
    }

    // 🧠 проверяем, что это сообщение
    if (!update.message || !update.message.text) {
      return new Response("no message");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;

    // 🧩 логика бота
    let reply = "🤖 не понял команду";

    if (text === "/start") {
      reply = "🛒 бот магазина запущен";
    }

    if (text === "/catalog") {
      reply = "📦 каталог:\n1. Товар A\n2. Товар B";
    }

    if (text === "/help") {
      reply = "команды: /start /catalog";
    }

    // 📤 отправка ответа в Telegram
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

    return new Response("ok");
  }
};
