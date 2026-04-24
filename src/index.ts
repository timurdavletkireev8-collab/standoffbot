const BOT_TOKEN = "8691254747:AAHTjhxn3LhMQsg54dkkX2aMTQw2gfPr6Ug";
const BOT_USERNAME = "ВСТАВЬ_USERNAME";
const ADMINS = [7020322752]; // твой ID

export default {
  async fetch(req: Request, env: any): Promise<Response> {

    if (req.method !== "POST") return new Response("OK");

    let update: any;
    try { update = await req.json(); } catch { return new Response("bad json"); }

    const msg = update.message;
    const cb = update.callback_query;

    const chatId = msg?.chat?.id || cb?.message?.chat?.id;
    const userId = msg?.from?.id || cb?.from?.id;

    if (!chatId || !userId) return new Response("no data");

    const text = msg?.text || "";
    const data = cb?.data;

    // =========================
    // 🚫 BAN CHECK
    // =========================
    const banned = await env.DB.get(`ban_${userId}`);
    if (banned) return new Response("banned");

    // =========================
    // 🧠 ADMIN CHECK
    // =========================
    const isAdmin = ADMINS.includes(userId);

    // =========================
    // 👤 /start + уровни рефералов
    // =========================
    if (text.startsWith("/start")) {

      const refId = text.split(" ")[1];

      let user = await getUser(env, userId);

      if (!user) {
        user = {
          balance: 0,
          invited: 0,
          level: 1,
          refBy: refId || null,
          reg: Date.now(),
          lastClick: 0
        };

        await env.DB.put(`u_${userId}`, JSON.stringify(user));

        // рефералка + анти-самонакрутка
        if (refId && refId !== String(userId)) {
          let ref = await getUser(env, Number(refId));

          if (ref) {
            ref.invited += 1;
            ref.balance += getReward(ref.invited);
            await env.DB.put(`u_${refId}`, JSON.stringify(ref));
          }
        }
      }

      return send(chatId,
`👋 Добро пожаловать

💰 Баланс: ${user.balance}
👥 Рефералы: ${user.invited}
⭐ Уровень: ${user.level}`, menu(isAdmin));
    }

    // =========================
    // 📊 ПРОФИЛЬ
    // =========================
    if (text === "/profile") {
      const u = await getUser(env, userId);

      return send(chatId,
`👤 ПРОФИЛЬ

💰 Баланс: ${u.balance}
👥 Рефералы: ${u.invited}
⭐ Уровень: ${u.level}`);
    }

    // =========================
    // 🚫 BAN SYSTEM (admin)
    // =========================
    if (isAdmin && text.startsWith("/ban")) {
      const id = text.split(" ")[1];
      await env.DB.put(`ban_${id}`, "1");
      return send(chatId, `🚫 User ${id} banned`);
    }

    if (isAdmin && text.startsWith("/unban")) {
      const id = text.split(" ")[1];
      await env.DB.delete(`ban_${id}`);
      return send(chatId, `✅ User ${id} unbanned`);
    }

    // =========================
    // 💸 PAYOUT REQUEST
    // =========================
    if (text === "/withdraw") {
      const u = await getUser(env, userId);

      if (u.balance < 100) {
        return send(chatId, "❌ Минимум 100₽");
      }

      await env.DB.put(`payout_${userId}`, JSON.stringify({
        userId,
        amount: u.balance,
        status: "pending"
      }));

      return send(chatId, "💸 Заявка отправлена");
    }

    // =========================
    // 📊 TOP LEVELS (admin)
    // =========================
    if (isAdmin && text === "/stats") {
      const top = await getTop(env);

      return send(chatId, top);
    }

    // =========================
    // CALLBACK
    // =========================
    if (cb) {
      await answer(cb.id);

      if (data === "profile") {
        const u = await getUser(env, userId);

        return send(chatId,
`👤 Профиль

💰 ${u.balance}
👥 ${u.invited}
⭐ ${u.level}`, menu(isAdmin));
      }

      if (data === "withdraw") {
        return send(chatId, "💸 /withdraw для вывода");
      }
    }

    return new Response("ok");

    // =========================
    // FUNCTIONS
    // =========================

    async function getUser(env: any, id: number) {
      const u = await env.DB.get(`u_${id}`);
      return u ? JSON.parse(u) : null;
    }

    function getReward(invited: number) {
      // уровни рефералов
      if (invited > 50) return 25;
      if (invited > 20) return 15;
      if (invited > 5) return 10;
      return 5;
    }

    async function getTop(env: any) {
      const list = await env.DB.list({ prefix: "u_" });

      let arr = [];

      for (let k of list.keys) {
        const u = await env.DB.get(k.name);
        if (!u) continue;
        arr.push(JSON.parse(u));
      }

      arr.sort((a, b) => b.invited - a.invited);

      return arr.slice(0, 5)
        .map((u, i) => `${i + 1}. 👤 ${u.invited} реф | ⭐ ${u.level}`)
        .join("\n");
    }

    function menu(admin: boolean) {
      const base = [
        [{ text: "👤 Профиль", callback_data: "profile" }],
        [{ text: "💸 Вывод", callback_data: "withdraw" }]
      ];

      if (admin) {
        base.push([{ text: "🛠 Admin Panel", callback_data: "admin" }]);
      }

      return { inline_keyboard: base };
    }

    async function send(chatId: number, text: string, kb?: any) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: kb
        })
      });

      return new Response("ok");
    }

    async function answer(id: string) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: id })
      });
    }
  }
};
