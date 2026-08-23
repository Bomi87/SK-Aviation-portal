/* =========================================================
   인증 전 화면 깜박임 방지
   common-auth.js가 실행되는 즉시 보호 화면을 숨기고,
   인증 결과가 결정된 뒤 한 번만 표시합니다.
========================================================= */

(function portalInstallAuthPendingStyle() {
  document.documentElement.classList.add("portal-auth-pending");

  if (document.getElementById("portalAuthPendingStyle")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "portalAuthPendingStyle";
  style.textContent = `
    html.portal-auth-pending #authScreen,
    html.portal-auth-pending #appRoot {
      visibility: hidden !important;
    }

    html.portal-auth-ready #authScreen,
    html.portal-auth-ready #appRoot {
      visibility: visible;
    }

    html.portal-auth-pending body::before {
      content: "";
      position: fixed;
      left: 50%;
      top: calc(50% - 18px);
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;
      border: 3px solid #dbeafe;
      border-top-color: #2563eb;
      border-radius: 50%;
      z-index: 2147483646;
      animation: portalAuthSpin .8s linear infinite;
    }

    html.portal-auth-pending body::after {
      content: "앱을 불러오는 중...";
      position: fixed;
      left: 0;
      right: 0;
      top: calc(50% + 20px);
      text-align: center;
      color: #667085;
      font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      z-index: 2147483646;
    }

    @keyframes portalAuthSpin {
      to { transform: rotate(360deg); }
    }
  `;

  (document.head || document.documentElement).appendChild(style);
})();


function portalFinishAuthRender() {
  document.documentElement.classList.remove("portal-auth-pending");
  document.documentElement.classList.add("portal-auth-ready");
}


const PORTAL_AUTH_CONFIG = {
  GOOGLE_CLIENT_ID:
    "434108168386-jn8hp4mflhn68n98n6m9r1nm6iv7b3qe.apps.googleusercontent.com",

  // 인증용 Apps Script Web App URL
  AUTH_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzLlWbfUkvKflGGMy7Z4W6dD8PVYGAGYIktA3urbvLX07AZqC7htH3IJH6-bmE6srxf/exec",

  // 같은 bomi87.github.io 도메인의 앱들이 공통으로 사용하는 로그인 캐시
  // V2로 변경하여 기존 30일 캐시의 사용자명(예: 사용자1)을 즉시 폐기합니다.
  // V3: 과거 30일 캐시를 즉시 폐기합니다.
  CACHE_KEY: "bomiPortalAuthCacheV3",

  // Google 승인 팝업 반복 방지를 위한 로그인/권한 캐시 기간
  // ApprovedUsers의 이름/권한 변경이 오래 남지 않도록 24시간만 유지합니다.
  CACHE_HOURS: 24
};

/* =========================================================
   포털 접속 세션 ID

   포털에서 앱 URL에 portalSessionId를 전달합니다.
   같은 포털 접속에서 연 모든 앱은 동일한 SessionId로 요약됩니다.
========================================================= */

const PORTAL_SESSION_ID_KEY = "bomiPortalSessionId";

function portalCreateSessionId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "PS-" + window.crypto.randomUUID();
    }
  } catch (err) {}

  return (
    "PS-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 12)
  );
}

function portalGetSessionId() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = String(params.get("portalSessionId") || "").trim();

    if (fromUrl) {
      sessionStorage.setItem(PORTAL_SESSION_ID_KEY, fromUrl);
      return fromUrl;
    }

    let saved = sessionStorage.getItem(PORTAL_SESSION_ID_KEY);

    if (!saved) {
      // 포털을 거치지 않고 앱에 직접 들어온 경우를 위한 독립 세션
      saved = portalCreateSessionId();
      sessionStorage.setItem(PORTAL_SESSION_ID_KEY, saved);
    }

    return saved;
  } catch (err) {
    return portalCreateSessionId();
  }
}

const CURRENT_PORTAL_SESSION_ID = portalGetSessionId();



/* =========================================================
   앱 경로 ↔ 포털 APP ID 연결

   포털 내부 action 앱과 외부 사이트는 여기에 넣지 않습니다.
   common-auth.js를 직접 불러오는 GitHub Pages 앱만 등록합니다.
========================================================= */

const PORTAL_APP_RULES = [
  { id: "currency-checker", path: "/Currency/" },
  { id: "uas-trip-prep", path: "/UAS_TRIP/" },
  { id: "wfs-trip-prep", path: "/WFS_TRIP/" },
  { id: "subscription-manager", path: "/SUBSCRIPTION/" },
  { id: "fbo-search", path: "/FBO/" },
  { id: "katfm-regulation", path: "/ATFM/" },
  { id: "flight-search", path: "/Flight_Search/" },
  { id: "factsheet", path: "/FACTSHEET/" },
  { id: "world-fuel-price", path: "/WFS_FUEL/" },
  { id: "past-wx", path: "/Past_WX/" },
  { id: "wx-forecast", path: "/WX_FORECAST/" },
  { id: "windy-airport-weather-check", path: "/WINDY/" },
  { id: "faa-artcc-advisory-map", path: "/FAA_ATCSCC/" },
  { id: "faa-cnd-diagram", path: "/U.S_Airport_Diagram/" },
  { id: "receipt-expense-manager", path: "/Receipt/" },

  // 동일 경로를 쿼리스트링으로 구분
  {
    id: "hl8080-route",
    path: "/FLIGHT_MAP/",
    query: {
      key: "file",
      includes: "HL8080.kml"
    }
  },
  {
    id: "hl8372-route",
    path: "/FLIGHT_MAP/",
    query: {
      key: "file",
      includes: "HL8372.kml"
    }
  },

  { id: "opsgroup-news", path: "/OPS_NEWS/" },
  { id: "japan-slot-checker", path: "/JAPAN_SLOT/" },
   { id: "ubikais-ats-flight-plan", path: "/UBIKAIS/" },
  { id: "vip-ntm", path: "/VIP_NTM/" },
  { id: "hospital-search", path: "/Hospital/" },
  { id: "fbo-fee-lookup", path: "/FBO_Fees/" }
];


let PORTAL_AUTH_STARTED = false;
let PORTAL_SESSION_CHECK_STARTED = false;


/* =========================================================
   포털에서 전달된 서명 세션 읽기

   URL fragment는 서버와 Referrer에 전송되지 않습니다.
   읽은 즉시 주소에서 제거합니다.
========================================================= */

function portalTakeSignedSessionToken() {
  try {
    const rawHash = window.location.hash
      ? window.location.hash.slice(1)
      : "";

    if (!rawHash) return "";

    const params = new URLSearchParams(rawHash);
    const token = String(
      params.get("portalSessionToken") || ""
    ).trim();

    if (!token) return "";

    params.delete("portalSessionToken");

    const cleanHash = params.toString();
    const cleanUrl =
      window.location.pathname +
      window.location.search +
      (cleanHash ? "#" + cleanHash : "");

    window.history.replaceState(null, "", cleanUrl);
    return token;

  } catch (err) {
    return "";
  }
}

const PORTAL_SIGNED_SESSION_TOKEN = portalTakeSignedSessionToken();


/* =========================================================
   현재 페이지 APP ID 판별
========================================================= */

function portalNormalizePath(pathname) {
  let path = String(pathname || "/");

  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  if (!path.endsWith("/")) {
    const lastPart = path.split("/").pop() || "";

    // index.html 같은 파일명이 아니면 디렉터리 경로로 처리
    if (!lastPart.includes(".")) {
      path += "/";
    }
  }

  return path;
}


function portalGetCurrentAppId() {
  const pathname = portalNormalizePath(window.location.pathname);
  const params = new URLSearchParams(window.location.search);

  // 같은 경로를 사용하는 앱은 쿼리 조건을 먼저 확인
  const queryMatch = PORTAL_APP_RULES.find(function (rule) {
    if (!rule.query) return false;
    if (!pathname.startsWith(rule.path)) return false;

    const value = params.get(rule.query.key) || "";
    return value.includes(rule.query.includes);
  });

  if (queryMatch) {
    return queryMatch.id;
  }

  // 일반 앱은 경로가 긴 규칙부터 확인
  const pathMatch = PORTAL_APP_RULES
    .filter(function (rule) {
      return !rule.query;
    })
    .slice()
    .sort(function (a, b) {
      return b.path.length - a.path.length;
    })
    .find(function (rule) {
      return pathname.startsWith(rule.path);
    });

  return pathMatch ? pathMatch.id : "";
}


/* =========================================================
   permissions 정리 및 앱 권한 확인
========================================================= */

function portalNormalizePermissions(value) {
  if (Array.isArray(value)) {
    return value
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  return [];
}


function portalCanAccessApp(user, appId) {
  if (!user || !appId) return false;

  const role = String(user.role || "USER")
    .trim()
    .toUpperCase();

  const permissions = portalNormalizePermissions(user.permissions);

  if (role === "ADMIN") return true;
  if (permissions.includes("*")) return true;

  return permissions.includes(appId);
}


/* =========================================================
   공통 로그인 캐시
========================================================= */

function portalLoadAuthCache() {
  try {
    const raw = localStorage.getItem(PORTAL_AUTH_CONFIG.CACHE_KEY);

    if (!raw) return null;

    const cached = JSON.parse(raw);

    if (
      !cached.email ||
      !cached.expiresAt ||
      Date.now() > Number(cached.expiresAt)
    ) {
      localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
      return null;
    }

    const role = String(cached.role || "USER")
      .trim()
      .toUpperCase();

    // 이전 형식 캐시는 권한 목록이 없으므로 재로그인
    if (
      role !== "ADMIN" &&
      !Array.isArray(cached.permissions)
    ) {
      localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
      return null;
    }

    return {
      email: String(cached.email || "").trim(),
      role: role,
      name: String(cached.name || ""),
      picture: String(cached.picture || ""),
      permissions:
        role === "ADMIN"
          ? ["*"]
          : portalNormalizePermissions(cached.permissions),
      expiresAt: Number(cached.expiresAt)
    };

  } catch (err) {
    console.warn("인증 캐시 읽기 실패", err);
    localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
    return null;
  }
}


function portalSaveAuthCache(user) {
  try {
    if (!user || !user.email) return;

    const role = String(user.role || "USER")
      .trim()
      .toUpperCase();

    // 캐시 사용만으로 만료시간이 계속 연장되지 않도록,
    // 기존 만료시간이 남아 있으면 그대로 유지합니다.
    const savedExpiresAt = Number(user.expiresAt || 0);
    const expiresAt = savedExpiresAt > Date.now()
      ? savedExpiresAt
      : Date.now() +
        PORTAL_AUTH_CONFIG.CACHE_HOURS * 60 * 60 * 1000;

    localStorage.setItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY,
      JSON.stringify({
        email: String(user.email || "").trim(),
        role: role,
        name: String(user.name || ""),
        picture: String(user.picture || ""),
        permissions:
          role === "ADMIN"
            ? ["*"]
            : portalNormalizePermissions(user.permissions),
        expiresAt: expiresAt
      })
    );

  } catch (err) {
    console.warn("인증 캐시 저장 실패", err);
  }
}


/* =========================================================
   현재 앱 세션 상태
========================================================= */

function portalClearSessionApproval() {
  try {
    sessionStorage.removeItem("portalApproved");
    sessionStorage.removeItem("portalApprovedAppId");
  } catch (err) {}
}


function portalSetSessionApproval(appId) {
  try {
    sessionStorage.setItem("portalApproved", "true");
    sessionStorage.setItem("portalApprovedAppId", appId);
  } catch (err) {}
}


/* =========================================================
   인증 완료 알림
========================================================= */

function portalNotifyApproved(user, appId) {
  const detail = {
    user: user,
    appId: appId
  };

  try {
    window.dispatchEvent(
      new CustomEvent("portal-auth-approved", {
        detail: detail
      })
    );
  } catch (err) {}

  // 각 앱이 window.startProtectedApp을 정의한 경우 인증 후 실행
  if (typeof window.startProtectedApp === "function") {
    try {
      window.startProtectedApp(detail);
    } catch (err) {
      console.error("보호 앱 시작 함수 실행 오류", err);
    }
  }
}


/* =========================================================
   앱 표시 / 차단
========================================================= */

function portalShowApp(user, appId) {
  if (!portalCanAccessApp(user, appId)) {
    portalClearSessionApproval();


setTimeout(function () {
  if (document.documentElement.classList.contains("portal-auth-pending")) {
    portalShowDenied(
      "Google 로그인 확인이 지연되고 있습니다.<br>아래 버튼으로 다시 접속해 주세요."
    );
  }
}, 5000);



    portalShowDenied(
      [
        "이 앱에 대한 사용 권한이 없습니다.",
        "관리자에게 앱 권한을 요청해 주세요.",
        user && user.email ? "계정: " + user.email : ""
      ]
        .filter(Boolean)
        .join("<br>")
    );

    return;
  }

  const role = String(user.role || "USER")
    .trim()
    .toUpperCase();

  const normalizedUser = {
    ...user,
    role: role,
    permissions:
      role === "ADMIN"
        ? ["*"]
        : portalNormalizePermissions(user.permissions)
  };

  const authScreen = document.getElementById("authScreen");
  const appRoot = document.getElementById("appRoot");

  if (authScreen) {
    authScreen.style.display = "none";
  }

  if (appRoot) {
    appRoot.style.display = "block";
  }

  portalFinishAuthRender();

  window.CURRENT_PORTAL_USER = normalizedUser;
  window.CURRENT_PORTAL_APP_ID = appId;

  portalSetSessionApproval(appId);
  portalSaveAuthCache(normalizedUser);
  portalNotifyApproved(normalizedUser, appId);
}


function portalShowDenied(message) {
  portalClearSessionApproval();

  window.CURRENT_PORTAL_USER = null;
  window.CURRENT_PORTAL_APP_ID = "";

  const authScreen = document.getElementById("authScreen");
  const appRoot = document.getElementById("appRoot");

  if (appRoot) {
    appRoot.style.display = "none";
  }

  if (!authScreen) {
    portalFinishAuthRender();
    console.error(message || "접근 권한이 없습니다.");
    return;
  }

  authScreen.style.display = "flex";
  portalFinishAuthRender();

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
      <div style="
        font-size:22px;
        font-weight:800;
        margin-bottom:10px;
        color:#17202a;
      ">
        Access Required
      </div>

      <div style="
        font-size:14px;
        line-height:1.6;
        color:#667085;
        margin-bottom:16px;
      ">
        ${message || "승인된 사용자만 사용할 수 있습니다."}
      </div>

      <div id="googleButtonWrap"></div>
    </div>
  `;

  renderPortalGoogleButton();
}


/* =========================================================
   Google 로그인 버튼
========================================================= */

function renderPortalGoogleButton() {
  const wrap = document.getElementById("googleButtonWrap");

  if (!wrap) return;

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    wrap.innerHTML =
      "Google 로그인 모듈을 불러오지 못했습니다. 새로고침해 주세요.";
    return;
  }

  wrap.innerHTML = "";

  const buttonWidth = Math.max(
    240,
    Math.min(300, window.innerWidth - 80)
  );

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


/* =========================================================
   Apps Script 승인 확인
========================================================= */


function portalLogCachedAccess(user, appId) {
  try {
    const normalizedAppId = String(appId || "").trim();

    if (!normalizedAppId || normalizedAppId === "portal") {
      return;
    }

    const sessionKey =
      "portalAppLogged:" +
      CURRENT_PORTAL_SESSION_ID +
      ":" +
      normalizedAppId;

    if (sessionStorage.getItem(sessionKey) === "true") {
      return;
    }

    sessionStorage.setItem(sessionKey, "true");

    fetch(
      PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL,
      {
        method: "POST",
        keepalive: true,
        body: JSON.stringify({
          mode: "SESSION_APP_UPDATE",
          sessionId: CURRENT_PORTAL_SESSION_ID,
          email: user && user.email ? user.email : "",
          role: user && user.role ? user.role : "",
          name: user && user.name ? user.name : "",
          appId: normalizedAppId
        })
      }
    ).catch(function () {
      sessionStorage.removeItem(sessionKey);
    });

  } catch (err) {
    console.warn("세션 요약 전송 실패", err);
  }
}

async function portalCheckApproval(idToken, appId) {
  const res = await fetch(
    PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL,
    {
      method: "POST",
      body: JSON.stringify({
        idToken: idToken,
        appId: appId,
        sessionId: CURRENT_PORTAL_SESSION_ID
      })
    }
  );

  if (!res.ok) {
    throw new Error(
      "승인 서버 응답 오류 HTTP " + res.status
    );
  }

  return await res.json();
}


async function portalCheckSignedSession(portalSessionToken, appId) {
  const res = await fetch(
    PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL,
    {
      method: "POST",
      body: JSON.stringify({
        mode: "PORTAL_SESSION_AUTH",
        portalSessionToken: portalSessionToken,
        appId: appId,
        sessionId: CURRENT_PORTAL_SESSION_ID
      })
    }
  );

  if (!res.ok) {
    throw new Error(
      "포털 세션 확인 오류 HTTP " + res.status
    );
  }

  return await res.json();
}


/* =========================================================
   Google 로그인 결과
========================================================= */

async function portalHandleCredentialResponse(response) {
  const appId = portalGetCurrentAppId();

  try {
    if (!appId) {
      portalShowDenied(
        "이 앱의 권한 ID가 common-auth.js에 등록되지 않았습니다."
      );
      return;
    }

    if (!response || !response.credential) {
      portalShowDenied(
        "Google 로그인 정보를 가져오지 못했습니다."
      );
      return;
    }

    const result = await portalCheckApproval(
      response.credential,
      appId
    );

    if (result.ok === true) {
      result.permissions =
        portalNormalizePermissions(result.permissions);

      portalShowApp(result, appId);
      return;
    }

    localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);

    let message =
      "승인되지 않은 계정입니다.<br>" +
      "관리자 승인 후 사용 가능합니다.";

    if (result.reason === "APP_NOT_ALLOWED") {
      message =
        "승인된 계정이지만 이 앱에 대한 권한이 없습니다.<br>" +
        "관리자에게 앱 권한을 요청해 주세요.";
    }

    portalShowDenied(
      message +
      (result.email
        ? "<br>계정: " + result.email
        : "")
    );

  } catch (err) {
    console.error(err);

    portalShowDenied(
      "승인 확인 중 오류가 발생했습니다. 다시 시도해 주세요."
    );
  }
}


/* =========================================================
   인증 화면 초기 상태
========================================================= */

function portalPrepareAuthScreen() {
  const authScreen = document.getElementById("authScreen");

  if (!authScreen) return;

  authScreen.style.display = "flex";

  if (!authScreen.innerHTML.trim()) {
    authScreen.textContent = "승인 확인 중...";
  }
}


/* =========================================================
   인증 시작

   핵심:
   - 유효한 공통 캐시가 있고 현재 앱 권한이 있으면 즉시 앱 표시
   - 따라서 앱 이동/포털 복귀 때 Google 승인 팝업이 반복되지 않음
   - 캐시가 없거나 만료된 경우에만 Google 로그인 실행
========================================================= */

async function startPortalAuth() {
  const appId = portalGetCurrentAppId();

  if (!appId) {
    portalShowDenied(
      "이 앱의 권한 ID가 common-auth.js에 등록되지 않았습니다."
    );
    return;
  }

  // 이미 검증된 공통 캐시가 있으면 네트워크 대기 없이 즉시 표시합니다.
  const cachedUser = portalLoadAuthCache();

  if (
    cachedUser &&
    portalCanAccessApp(cachedUser, appId)
  ) {
    portalShowApp(cachedUser, appId);
    portalLogCachedAccess(cachedUser, appId);
    return;
  }

  if (
    cachedUser &&
    !portalCanAccessApp(cachedUser, appId)
  ) {
    portalShowDenied(
      [
        "이 앱에 대한 사용 권한이 없습니다.",
        "관리자에게 앱 권한을 요청해 주세요.",
        cachedUser.email ? "계정: " + cachedUser.email : ""
      ]
        .filter(Boolean)
        .join("<br>")
    );
    return;
  }

  // 포털에서 정상적으로 연 앱은 서명 세션으로 먼저 승인합니다.
  // 성공하면 Google 로그인 화면을 다시 표시하지 않습니다.
  if (
    PORTAL_SIGNED_SESSION_TOKEN &&
    !PORTAL_SESSION_CHECK_STARTED
  ) {
    PORTAL_SESSION_CHECK_STARTED = true;

    try {
      const sessionResult = await portalCheckSignedSession(
        PORTAL_SIGNED_SESSION_TOKEN,
        appId
      );

      if (sessionResult.ok === true) {
        sessionResult.permissions =
          portalNormalizePermissions(sessionResult.permissions);

        portalShowApp(sessionResult, appId);
        return;
      }

      if (
        sessionResult.reason === "APP_NOT_ALLOWED" ||
        sessionResult.reason === "NOT_APPROVED"
      ) {
        portalShowDenied(
          sessionResult.reason === "APP_NOT_ALLOWED"
            ? "이 앱에 대한 사용 권한이 없습니다.<br>관리자에게 앱 권한을 요청해 주세요."
            : "승인되지 않은 계정입니다."
        );
        return;
      }
    } catch (err) {
      console.warn("포털 서명 세션 확인 실패", err);
    }
  }

  portalPrepareAuthScreen();

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(startPortalAuth, 300);
    return;
  }

  if (PORTAL_AUTH_STARTED) return;

  PORTAL_AUTH_STARTED = true;

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


/* =========================================================
   시작

   기존 앱에서 sessionStorage만 보고 먼저 실행하는 것을 방지하기 위해
   common-auth.js가 로드되는 즉시 현재 앱 승인값을 초기화합니다.
   인증 성공 후 현재 APP ID로 다시 저장됩니다.
========================================================= */

portalClearSessionApproval();

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startPortalAuth);
} else {
  startPortalAuth();
}


// 인증 모듈 또는 네트워크가 지연되더라도 흰 화면으로 영구 정지하지 않습니다.
setTimeout(function () {
  if (document.documentElement.classList.contains("portal-auth-pending")) {
    portalShowDenied(
      "로그인 확인이 지연되고 있습니다.<br>아래 버튼으로 다시 접속해 주세요."
    );
  }
}, 8000);
