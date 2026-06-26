const PORTAL_AUTH_CONFIG = {
  GOOGLE_CLIENT_ID:
    "434108168386-jn8hp4mflhn68n98n6m9r1nm6iv7b3qe.apps.googleusercontent.com",

  // 새 배포 URL이 다르면 이 주소만 교체하세요.
  AUTH_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycby-Pd2UTs67a3omoacvOjnQMJzqBxkDsvoXhANl9G09o5CyZN1Y3rQjt8P4Xp4anLbU/exec",

  CACHE_KEY: "bomiPortalAuthCache",
  CACHE_HOURS: 24 * 30
};

/*
 * 포털 tools 배열의 id와 GitHub Pages 경로를 연결합니다.
 * common-auth.js를 사용하는 자체 GitHub Pages 앱만 등록합니다.
 *
 * 포털 내부에서 실행되는 action 앱:
 *   atis-guru, awc-metar-taf, faa-airport-status, ops-group-airport
 * 외부 사이트:
 *   amos-realtime, faa-rvr, faa-nas-status, ops-group-briefings
 * 위 항목들은 개별 페이지에 common-auth.js를 삽입할 수 없으므로 이 경로표 대상이 아닙니다.
 */
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
  {
    id: "hl8080-route",
    path: "/FLIGHT_MAP/",
    query: { key: "file", includes: "HL8080.kml" }
  },
  {
    id: "hl8372-route",
    path: "/FLIGHT_MAP/",
    query: { key: "file", includes: "HL8372.kml" }
  },
  { id: "opsgroup-news", path: "/OPS_NEWS/" },
  { id: "hospital-search", path: "/Hospital/" },
  { id: "fbo-fee-lookup", path: "/FBO_Fees/" }
];

let PORTAL_AUTH_STARTED = false;


function portalNormalizePath(pathname) {
  let path = String(pathname || "/");

  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  if (!path.endsWith("/")) {
    const lastPart = path.split("/").pop() || "";

    // index.html 같은 파일명이 아니면 디렉터리 경로로 취급
    if (!lastPart.includes(".")) {
      path += "/";
    }
  }

  return path;
}


function portalGetCurrentAppId() {
  const pathname = portalNormalizePath(window.location.pathname);
  const params = new URLSearchParams(window.location.search);

  // 같은 /FLIGHT_MAP/ 경로를 사용하는 앱은 query 조건부터 확인
  const queryMatch = PORTAL_APP_RULES.find(function (rule) {
    if (!rule.query) return false;
    if (!pathname.startsWith(rule.path)) return false;

    const value = params.get(rule.query.key) || "";

    return value.includes(rule.query.includes);
  });

  if (queryMatch) {
    return queryMatch.id;
  }

  // 그 외 앱은 경로가 긴 규칙부터 확인
  const pathMatch = PORTAL_APP_RULES
    .filter(function (rule) {
      return !rule.query;
    })
    .sort(function (a, b) {
      return b.path.length - a.path.length;
    })
    .find(function (rule) {
      return pathname.startsWith(rule.path);
    });

  return pathMatch ? pathMatch.id : "";
}


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


function portalLoadAuthCache() {
  try {
    const raw = localStorage.getItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);

    if (
      !cached.email ||
      !cached.expiresAt ||
      Date.now() > cached.expiresAt
    ) {
      localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
      return null;
    }

    const role = String(cached.role || "USER").toUpperCase();

    // 이전 형식의 USER 캐시에는 permissions가 없으므로 재로그인
    if (
      role !== "ADMIN" &&
      cached.permissions === undefined
    ) {
      localStorage.removeItem(PORTAL_AUTH_CONFIG.CACHE_KEY);
      return null;
    }

    cached.role = role;
    cached.permissions =
      role === "ADMIN"
        ? ["*"]
        : portalNormalizePermissions(cached.permissions);

    return cached;

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

    localStorage.setItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY,
      JSON.stringify({
        email: user.email || "",
        role: role,
        name: user.name || "",
        picture: user.picture || "",
        permissions:
          role === "ADMIN"
            ? ["*"]
            : portalNormalizePermissions(user.permissions),
        expiresAt:
          Date.now() +
          1000 *
          60 *
          60 *
          PORTAL_AUTH_CONFIG.CACHE_HOURS
      })
    );

  } catch (err) {
    console.warn("인증 캐시 저장 실패", err);
  }
}


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


function portalNotifyApproved(user, appId) {
  const detail = {
    user: user,
    appId: appId
  };

  window.dispatchEvent(
    new CustomEvent("portal-auth-approved", {
      detail: detail
    })
  );

  // 앱에서 이 콜백 방식을 사용해도 됨
  if (typeof window.startProtectedApp === "function") {
    try {
      window.startProtectedApp(detail);
    } catch (err) {
      console.error("보호 앱 시작 함수 실행 오류", err);
    }
  }
}


function portalShowApp(user, appId) {
  if (!portalCanAccessApp(user, appId)) {
    portalClearSessionApproval();

    portalShowDenied(
      [
        "이 앱에 대한 사용 권한이 없습니다.",
        "관리자에게 앱 권한을 요청해 주세요.",
        user && user.email ? "계정: " + user.email : ""
      ].filter(Boolean).join("<br>")
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

  window.CURRENT_PORTAL_USER = normalizedUser;
  window.CURRENT_PORTAL_APP_ID = appId;

  portalSetSessionApproval(appId);
  portalSaveAuthCache(normalizedUser);
  portalNotifyApproved(normalizedUser, appId);
}


function portalShowDenied(message) {
  portalClearSessionApproval();

  const authScreen = document.getElementById("authScreen");
  const appRoot = document.getElementById("appRoot");

  if (appRoot) {
    appRoot.style.display = "none";
  }

  if (!authScreen) {
    console.error(message || "접근 권한이 없습니다.");
    return;
  }

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


async function portalCheckApproval(idToken, appId) {
  const res = await fetch(
    PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL,
    {
      method: "POST",
      body: JSON.stringify({
        idToken: idToken,
        appId: appId
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
      "승인되지 않은 계정입니다.<br>관리자 승인 후 사용 가능합니다.";

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


function portalPrepareAuthScreen() {
  const authScreen = document.getElementById("authScreen");

  if (!authScreen) return;

  authScreen.style.display = "flex";

  if (!authScreen.innerHTML.trim()) {
    authScreen.textContent = "승인 확인 중...";
  }
}


function startPortalAuth() {
  const appId = portalGetCurrentAppId();

  // 등록되지 않은 경로는 기본 차단
  if (!appId) {
    portalShowDenied(
      "이 앱의 권한 ID가 common-auth.js에 등록되지 않았습니다."
    );
    return;
  }

  portalPrepareAuthScreen();

  const cachedUser = portalLoadAuthCache();

  // 30일 캐시에 현재 앱 권한이 있으면 즉시 표시
  if (
    cachedUser &&
    portalCanAccessApp(cachedUser, appId)
  ) {
    portalShowApp(cachedUser, appId);
    return;
  }

  // 캐시가 있으나 현재 앱 권한이 없으면 바로 차단
  if (
    cachedUser &&
    !portalCanAccessApp(cachedUser, appId)
  ) {
    portalShowDenied(
      [
        "이 앱에 대한 사용 권한이 없습니다.",
        "관리자에게 앱 권한을 요청해 주세요.",
        cachedUser.email
          ? "계정: " + cachedUser.email
          : ""
      ].filter(Boolean).join("<br>")
    );

    return;
  }

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


// common-auth.js가 실행되자마자 기존의 광역 세션 승인값을 제거합니다.
// 이후 현재 APP_ID 권한 확인에 성공한 경우에만 다시 저장합니다.
portalClearSessionApproval();

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startPortalAuth);
} else {
  startPortalAuth();
}
