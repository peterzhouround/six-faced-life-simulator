(function () {
  "use strict";
  const config = window.SIX_FACED_CLOUD_CONFIG || {};
  const url = String(config.url || "").replace(/\/$/, "");
  const key = String(config.publishableKey || "");
  // New publishable keys only: accepting arbitrary JWTs could expose service_role.
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  let session = null;
  // Verification emails may redirect with tokens. This app requires explicit login;
  // discard the fragment so credentials are not left in a copied game URL.
  if (/access_token=|refresh_token=/.test(window.location?.hash || "")) window.history.replaceState(null,"",window.location.pathname + window.location.search);
  function currentUser() {
    if (session && Date.now() >= session.expiresAt) session = null;
    return session ? { id: session.id, email: session.email } : null;
  }
  async function request(path, { method = "GET", body, authenticated = false } = {}) {
    if (!configured) throw new Error("云存档尚未配置，请使用本机或 JSON 存档。");
    if (authenticated && !currentUser()) throw new Error("请登录；登录可能已过期。");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const headers = { apikey: key, "Content-Type": "application/json" };
      if (authenticated) headers.Authorization = `Bearer ${session.token}`;
      const response = await fetch(url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        if (authenticated && response.status === 401) session = null;
        if (data?.code === "40001" || data?.code === "23505") throw new Error("另一设备已更新云档，请重新检查云端内容再上传。");
        if (response.status === 429) throw new Error("请求过于频繁，请稍后再试。");
        if ([400,401,422].includes(response.status)) throw new Error("请求未通过。请检查邮箱、密码、邮件验证状态及服务配置。");
        throw new Error("云服务请求失败，请检查网络、数据库表及权限配置；本机存档未变。");
      }
      return data;
    } catch (error) {
      if (error.name === "AbortError" || error instanceof TypeError) throw new Error("网络连接失败或超时。上传结果可能不确定，请先读取云端检查，勿反复提交。");
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function authenticate(email, password, signup = false) {
    session = null;
    const data = await request(signup ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password", { method:"POST", body:{email,password} });
    if (data.access_token && data.user?.id) session = { token:data.access_token, id:data.user.id, email:data.user.email, expiresAt:Date.now() + (data.expires_in || 3600) * 1000 };
    return currentUser();
  }
  async function logout() {
    try { if (currentUser()) await request("/auth/v1/logout", {method:"POST",authenticated:true}); }
    finally { session = null; }
  }
  async function read() {
    const user = currentUser();
    if (!user) throw new Error("请先登录。");
    const rows = await request(`/rest/v1/game_saves?user_id=eq.${encodeURIComponent(user.id)}&select=payload,revision,updated_at`, {authenticated:true});
    if (!Array.isArray(rows)) throw new Error("云端返回格式异常。");
    return rows[0] || null;
  }
  async function write(payload, revision) {
    if (!Number.isInteger(revision) || revision < 0) throw new Error("云档版本无效，请重新检查。");
    return request("/rest/v1/rpc/save_game", {method:"POST",authenticated:true,body:{p_payload:payload,p_expected_revision:revision}});
  }
  window.SixFacedCloud = Object.freeze({ configured, currentUser, authenticate, logout, read, write });
})();
