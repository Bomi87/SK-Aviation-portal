const PORTAL_AUTH_CONFIG = {
  GOOGLE_CLIENT_ID: "434108168386-jn8hp4mflhn68n98n6m9r1nm6iv7b3qe.apps.googleusercontent.com",
  AUTH_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby-Pd2UTs67a3omoacvOjnQMJzqBxkDsvoXhANl9G09o5CyZN1Y3rQjt8P4Xp4anLbU/exec",
  CACHE_KEY: "bomiPortalAuthCache"
};

function portalLoadAuthCache() {
  try {
    const raw = localStorage.getItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);

    if (!cached.email || !cached.expiresAt || Date.now() > cached.expiresAt) {
      localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
      return null;
    }

    return cached;
  } catch (err) {
    localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
    return null;
  }
}

function portalShowApp(user) {
  const authScreen = document.getElementById("authScreen");
  const appRoot = document.getElementById("appRoot");

  if (authScreen) authScreen.style.display = "none";
  if (appRoot) appRoot.style.display = "block";

  window.CURRENT_PORTAL_USER = user;
}

function portalShowDenied(message) {
  const authScreen = document.getElementById("authScreen");
  const appRoot = document.getElementById("appRoot");

  if (appRoot) appRoot.style.display = "none";

  if (authScreen) {
    authScreen.style.display = "flex";
    authScreen.innerHTML = `
      <div style="
        width:100%;
        max-width:420px;
        background:#fff;
        border:1px solid #e6ebf2;
        border-radius:20px;
        padding:26px;
        text-align:center;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;
        box-shadow:0 10px 28px rgba(15,23,42,.08);
      ">
        <div style="font-size:22px;font-weight:800;margin-bottom:10px;">
          Access Required
        </div>
        <div style="font-size:14px;line-height:1.6;color:#667085;margin-bottom:16px;">
          ${message || "승인된 사용자만 사용할 수 있습니다."}
        </div>
        <div id="googleButtonWrap"></div>
      </div>
    `;
  }

  renderPortalGoogleButton();
}

function renderPortalGoogleButton() {
  const wrap = document.getElementById("googleButtonWrap");
  if (!wrap) return;

  if (!window.google || !google.accounts || !google.accounts.id) {
    wrap.innerHTML = "Google 로그인 모듈을 불러오지 못했습니다. 새로고침해 주세요.";
    return;
  }

  wrap.innerHTML = "";

  const buttonWidth = Math.max(240, Math.min(300, window.innerWidth - 80));

  google.accounts.id.renderButton(
    wrap,
    {
      theme: "outline",
      size: "large",
      width: buttonWidth,
      text: "continue_with",
      shape: "pill"
    }
  );
}

async function portalCheckApproval(idToken) {
  const res = await fetch(PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      idToken: idToken
    })
  });

  if (!res.ok) {
    throw new Error("승인 서버 응답 오류 HTTP " + res.status);
  }

  return await res.json();
}

async function portalHandleCredentialResponse(response) {
  try {
    if (!response || !response.credential) {
      portalShowDenied("Google 로그인 정보를 가져오지 못했습니다.");
      return;
    }

    const result = await portalCheckApproval(response.credential);

    if (result.ok === true) {
      portalShowApp(result);
      return;
    }

    localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);

    portalShowDenied(`
      승인되지 않은 계정입니다.<br>
      관리자 승인 후 사용 가능합니다.<br>
      ${result.email ? "계정: " + result.email : ""}
    `);

  } catch (err) {
    console.error(err);
    portalShowDenied("승인 확인 중 오류가 발생했습니다. 다시 시도해 주세요.");
  }
}

function startPortalAuth() {
  const cachedUser = portalLoadAuthCache();

  // 포털에서 이미 승인받은 캐시가 있으면 앱 즉시 표시
  if (cachedUser) {
    portalShowApp(cachedUser);
    return;
  }

  const authScreen = document.getElementById("authScreen");

  if (authScreen) {
    authScreen.style.display = "flex";
    authScreen.innerHTML = `
      <div style="
        width:100%;
        max-width:420px;
        background:#fff;
        border:1px solid #e6ebf2;
        border-radius:20px;
        padding:26px;
        text-align:center;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;
        box-shadow:0 10px 28px rgba(15,23,42,.08);
      ">
        <div style="font-size:22px;font-weight:800;margin-bottom:10px;">
          승인 확인 중
        </div>
        <div style="font-size:14px;line-height:1.6;color:#667085;margin-bottom:16px;">
          승인된 사용자만 이 앱을 사용할 수 있습니다.
        </div>
        <div id="googleButtonWrap"></div>
      </div>
    `;
  }

  if (!window.google || !google.accounts || !google.accounts.id) {
    setTimeout(startPortalAuth, 300);
    return;
  }

  google.accounts.id.initialize({
    client_id: PORTAL_AUTH_CONFIG.GOOGLE_CLIENT_ID,
    callback: portalHandleCredentialResponse,
    auto_select: true,
    cancel_on_tap_outside: false
  });

  google.accounts.id.prompt(function (notification) {
    if (
      notification.isNotDisplayed() ||
      notification.isSkippedMoment() ||
      notification.isDismissedMoment()
    ) {
      renderPortalGoogleButton();
    }
  });
}

window.addEventListener("load", startPortalAuth);