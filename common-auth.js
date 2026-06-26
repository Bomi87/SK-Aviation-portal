```js
const PORTAL_AUTH_CONFIG = {
  GOOGLE_CLIENT_ID:
    "434108168386-jn8hp4mflhn68n98n6m9r1nm6iv7b3qe.apps.googleusercontent.com",

  AUTH_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycby-Pd2UTs67a3omoacvOjnQMJzqBxkDsvoXhANl9G09o5CyZN1Y3rQjt8P4Xp4anLbU/exec",

  CACHE_KEY: "bomiPortalAuthCache",
  CACHE_HOURS: 24 * 30,

  // 이 앱의 고유 ID로 변경
  APP_ID: "uas-trip-prep"
};

let PORTAL_AUTH_STARTED = false;


/* =========================================================
   권한 데이터 정리
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


/* =========================================================
   현재 앱 접근 권한 확인
========================================================= */

function portalCanAccessApp(user) {
  if (!user) return false;

  const role = String(user.role || "USER")
    .trim()
    .toUpperCase();

  const permissions =
    portalNormalizePermissions(user.permissions);

  // 관리자는 전체 앱 허용
  if (role === "ADMIN") {
    return true;
  }

  // 전체 권한
  if (permissions.includes("*")) {
    return true;
  }

  // 해당 앱 ID 권한 확인
  return permissions.includes(
    PORTAL_AUTH_CONFIG.APP_ID
  );
}


/* =========================================================
   인증 캐시 읽기
========================================================= */

function portalLoadAuthCache() {
  try {
    const raw = localStorage.getItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY
    );

    if (!raw) return null;

    const cached = JSON.parse(raw);

    if (
      !cached.email ||
      !cached.expiresAt ||
      Date.now() > cached.expiresAt
    ) {
      localStorage.removeItem(
        PORTAL_AUTH_CONFIG.CACHE_KEY
      );

      return null;
    }

    // 예전 캐시에 permissions가 없으면 다시 로그인
    if (
      String(cached.role || "USER")
        .toUpperCase() !== "ADMIN" &&
      cached.permissions === undefined
    ) {
      localStorage.removeItem(
        PORTAL_AUTH_CONFIG.CACHE_KEY
      );

      return null;
    }

    cached.permissions =
      portalNormalizePermissions(
        cached.permissions
      );

    return cached;

  } catch (err) {
    console.warn(
      "인증 캐시 읽기 실패",
      err
    );

    localStorage.removeItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY
    );

    return null;
  }
}


/* =========================================================
   인증 캐시 저장
========================================================= */

function portalSaveAuthCache(user) {
  try {
    if (!user || !user.email) return;

    localStorage.setItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY,
      JSON.stringify({
        email: user.email || "",
        role: user.role || "USER",
        name: user.name || "",
        picture: user.picture || "",

        permissions:
          portalNormalizePermissions(
            user.permissions
          ),

        expiresAt:
          Date.now() +
          1000 *
          60 *
          60 *
          PORTAL_AUTH_CONFIG.CACHE_HOURS
      })
    );

  } catch (err) {
    console.warn(
      "인증 캐시 저장 실패",
      err
    );
  }
}


/* =========================================================
   앱 표시
========================================================= */

function portalShowApp(user) {
  if (!portalCanAccessApp(user)) {
    portalShowDenied(`
      이 앱에 대한 사용 권한이 없습니다.<br>
      관리자에게 앱 권한을 요청해 주세요.<br>
      ${
        user && user.email
          ? "계정: " + user.email
          : ""
      }
    `);

    return;
  }

  const authScreen =
    document.getElementById("authScreen");

  const appRoot =
    document.getElementById("appRoot");

  if (authScreen) {
    authScreen.style.display = "none";
  }

  if (appRoot) {
    appRoot.style.display = "block";
  }

  user.permissions =
    portalNormalizePermissions(
      user.permissions
    );

  window.CURRENT_PORTAL_USER = user;

  try {
    sessionStorage.setItem(
      "portalApproved",
      "true"
    );
  } catch (err) {}

  portalSaveAuthCache(user);
}


/* =========================================================
   접근 거부 화면
========================================================= */

function portalShowDenied(message) {
  const authScreen =
    document.getElementById("authScreen");

  const appRoot =
    document.getElementById("appRoot");

  if (appRoot) {
    appRoot.style.display = "none";
  }

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
        <div style="
          font-size:22px;
          font-weight:800;
          margin-bottom:10px;
        ">
          Access Required
        </div>

        <div style="
          font-size:14px;
          line-height:1.6;
          color:#667085;
          margin-bottom:16px;
        ">
          ${
            message ||
            "승인된 사용자만 사용할 수 있습니다."
          }
        </div>

        <div id="googleButtonWrap"></div>
      </div>
    `;
  }

  renderPortalGoogleButton();
}


/* =========================================================
   Google 로그인 버튼
========================================================= */

function renderPortalGoogleButton() {
  const wrap =
    document.getElementById(
      "googleButtonWrap"
    );

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
    Math.min(
      300,
      window.innerWidth - 80
    )
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
   승인 서버 확인
========================================================= */

async function portalCheckApproval(idToken) {
  const res = await fetch(
    PORTAL_AUTH_CONFIG.AUTH_SCRIPT_URL,
    {
      method: "POST",

      body: JSON.stringify({
        idToken: idToken,

        // 백엔드에서도 앱 권한 확인
        appId:
          PORTAL_AUTH_CONFIG.APP_ID
      })
    }
  );

  if (!res.ok) {
    throw new Error(
      "승인 서버 응답 오류 HTTP " +
      res.status
    );
  }

  return await res.json();
}


/* =========================================================
   Google 로그인 결과 처리
========================================================= */

async function portalHandleCredentialResponse(
  response
) {
  try {
    if (
      !response ||
      !response.credential
    ) {
      portalShowDenied(
        "Google 로그인 정보를 가져오지 못했습니다."
      );

      return;
    }

    const result =
      await portalCheckApproval(
        response.credential
      );

    if (result.ok === true) {
      result.permissions =
        portalNormalizePermissions(
          result.permissions
        );

      if (!portalCanAccessApp(result)) {
        localStorage.removeItem(
          PORTAL_AUTH_CONFIG.CACHE_KEY
        );

        portalShowDenied(`
          승인된 계정이지만 이 앱에 대한 권한이 없습니다.<br>
          관리자에게 앱 권한을 요청해 주세요.<br>
          ${
            result.email
              ? "계정: " + result.email
              : ""
          }
        `);

        return;
      }

      portalShowApp(result);
      return;
    }

    localStorage.removeItem(
      PORTAL_AUTH_CONFIG.CACHE_KEY
    );

    let message =
      "승인되지 않은 계정입니다.<br>관리자 승인 후 사용 가능합니다.";

    if (
      result.reason ===
      "APP_NOT_ALLOWED"
    ) {
      message =
        "승인된 계정이지만 이 앱에 대한 권한이 없습니다.<br>관리자에게 앱 권한을 요청해 주세요.";
    }

    portalShowDenied(`
      ${message}<br>
      ${
        result.email
          ? "계정: " + result.email
          : ""
      }
    `);

  } catch (err) {
    console.error(err);

    portalShowDenied(
      "승인 확인 중 오류가 발생했습니다. 다시 시도해 주세요."
    );
  }
}


/* =========================================================
   인증 시작
========================================================= */

function startPortalAuth() {
  const cachedUser =
    portalLoadAuthCache();

  // 30일 캐시에 현재 앱 권한이 있으면 즉시 표시
  if (
    cachedUser &&
    portalCanAccessApp(cachedUser)
  ) {
    portalShowApp(cachedUser);
    return;
  }

  // 캐시는 있지만 현재 앱 권한이 없는 경우
  if (
    cachedUser &&
    !portalCanAccessApp(cachedUser)
  ) {
    portalShowDenied(`
      이 앱에 대한 사용 권한이 없습니다.<br>
      관리자에게 앱 권한을 요청해 주세요.<br>
      계정: ${cachedUser.email || ""}
    `);

    return;
  }

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(
      startPortalAuth,
      300
    );

    return;
  }

  if (PORTAL_AUTH_STARTED) return;

  PORTAL_AUTH_STARTED = true;

  const authScreen =
    document.getElementById(
      "authScreen"
    );

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
        <div style="
          font-size:22px;
          font-weight:800;
          margin-bottom:10px;
        ">
          승인 확인 중
        </div>

        <div style="
          font-size:14px;
          line-height:1.6;
          color:#667085;
          margin-bottom:16px;
        ">
          승인된 사용자만 이 앱을 사용할 수 있습니다.
        </div>

        <div id="googleButtonWrap"></div>
      </div>
    `;
  }

  google.accounts.id.initialize({
    client_id:
      PORTAL_AUTH_CONFIG
        .GOOGLE_CLIENT_ID,

    callback:
      portalHandleCredentialResponse,

    auto_select: true,
    cancel_on_tap_outside: false
  });

  google.accounts.id.prompt(
    function (notification) {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        renderPortalGoogleButton();
      }
    }
  );
}


window.addEventListener(
  "load",
  startPortalAuth
);
```
