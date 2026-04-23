export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const update = await request.json();

      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        let responseText = "Я не понял тебя";

        if (text === "/start") {
          responseText = "Добро пожаловать в шоп 🛒\nВыбери:\n/catalog";
        }

        if (text === "/catalog") {
          responseText = "📦 Каталог:\n1. Товар 1 - 10$\n2. Товар 2 - 20$\n\nНапиши номер товара";
        }

        if (text === "1") {
          responseText = "Ты выбрал Товар 1\nОплата: напиши /buy1";
        }

        if (text === "/buy1") {
          responseText = "Оплата скоро будет тут (подключишь позже)";
        }

        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText
          })
        });
      }

      return new Response("ok");
    }

    return new Response("Bot is running");
  }
};
