const BOT_TOKEN = "8691254747:AAHTjhxn3LhMQsg54dkkX2aMTQw2gfPr6Ug";

export default {
  async fetch(request: Request, env: any): Promise<Response> {

    if (request.method !== "POST") {
      return new Response("WORKER HIT");
    }

    let update: any;

    try {
      update = await request.json();
    } catch {
      return new Response("bad json");
    }

    const msg = update.message || update.callback_query?.message;
    const chatId = msg?.chat?.id;

    if (!chatId) return new Response("no chat");

    const text = update.message?.text;
    const callback = update.callback_query;

    // 🛒 база товаров
    let products = await env.DB.get("products");

    if (!products) {
      products = JSON.stringify([
        { id: 1, name: "🎮 Скин A", price: 150 },
        { id: 2, name: "⚔️ Скин B", price: 250 },
        { id: 3, name: "💎 Бонус", price: 500 }
      ]);

      await env.DB.put("products", products);
    }

    const items = JSON.parse(products);

    // =========================
    // 📌 /start
    // =========================
    if (text === "/start") {
      await sendMessage(chatId,
        "👋 Добро пожаловать в магазин!\nВыбери действие:",
        mainMenu()
      );
      return new Response("ok");
    }

    // =========================
    // 📦 каталог
    // =========================
    if (text === "/catalog") {
      await sendMessage(chatId,
        "📦 Каталог товаров:",
        catalogMenu(items)
      );
      return new Response("ok");
    }

    // =========================
    // 🖱 нажатие кнопки
    // =========================
    if (callback) {
      const data = callback.data;

      if (data.startsWith("buy_")) {
        const id = Number(data.split("_")[1]);
        const item = items.find((p: any) => p.id === id);

        if (!item) return new Response("ok");

        await env.DB.put(`order_${chatId}`, JSON.stringify(item));

        await sendMessage(chatId,
          `✅ Ты купил: ${item.name}\n💰 Цена: ${item.price}₽`,
          mainMenu()
        );

        return new Response("ok");
      }

      if (data === "catalog") {
        await sendMessage(chatId, "📦 Каталог:", catalogMenu(items));
      }
    }

    return new Response("ok");

    // =========================
    // 📤 функция отправки
    // =========================
    async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: replyMarkup
        })
      });
    }

    // =========================
    // 🧠 меню
    // =========================
    function mainMenu() {
      return {
        inline_keyboard: [
          [{ text: "📦 Каталог", callback_data: "catalog" }]
        ]
      };
    }

    function catalogMenu(items: any[]) {
      return {
        inline_keyboard: [
          ...items.map(p => ([
            { text: `${p.name} - ${p.price}₽`, callback_data: `buy_${p.id}` }
          ])),
          [{ text: "🏠 Назад", callback_data: "catalog" }]
        ]
      };
    }
  }
};
