const BEIJING_OFFSET_MINUTES = 8 * 60;
const DAILY_SCHEDULED_WINDOW = {
  enabled: false,
  label: "Scheduled archive maintenance",
  startHour: 0,
  startMinute: 0,
  endHour: 6,
  endMinute: 0,
};

const TEMPORARY_MAINTENANCE_WINDOWS = [
  // Set enabled to true and adjust the ISO timestamps for one-off maintenance.
  // Example:
  // {
  //   enabled: true,
  //   label: "Emergency database maintenance",
  //   start: "2026-05-20T22:00:00+08:00",
  //   end: "2026-05-20T23:30:00+08:00",
  // },
  {
    enabled: false,
    label: "Temporary maintenance",
    start: "2026-05-20T22:00:00+08:00",
    end: "2026-05-20T23:30:00+08:00",
  },
];

const MAINTENANCE_PATH = "/maintenance.html";
const BYPASS_QUERY = "maintenance_bypass";
const STATIC_PATH_PREFIXES = ["/css/", "/js/", "/images/", "/api/", "/data/"];
const STATIC_FILE_PATTERN = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webp|xml)$/i;

export const config = {
  matcher: [
    "/((?!maintenance\\.html|favicon\\.svg|robots\\.txt|sitemap\\.xml|css/|js/|images/|api/|data/).*)",
  ],
};

function getBeijingMinutesOfDay(now = new Date()) {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + BEIJING_OFFSET_MINUTES) % (24 * 60);
}

function isWithinDailyWindow(minutesOfDay, window) {
  const start = window.startHour * 60 + window.startMinute;
  const end = window.endHour * 60 + window.endMinute;

  if (start === end) {
    return false;
  }

  if (start < end) {
    return minutesOfDay >= start && minutesOfDay < end;
  }

  return minutesOfDay >= start || minutesOfDay < end;
}

function getTemporaryMaintenance(now = Date.now()) {
  return TEMPORARY_MAINTENANCE_WINDOWS.find((window) => {
    if (!window.enabled) {
      return false;
    }

    const start = Date.parse(window.start);
    const end = Date.parse(window.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return false;
    }

    return now >= start && now < end;
  });
}

function getMaintenanceState(nowDate = new Date()) {
  const now = nowDate.getTime();
  const temporaryWindow = getTemporaryMaintenance(now);

  if (temporaryWindow) {
    return {
      active: true,
      type: "temporary",
      label: temporaryWindow.label,
    };
  }

  if (
    DAILY_SCHEDULED_WINDOW.enabled &&
    isWithinDailyWindow(getBeijingMinutesOfDay(nowDate), DAILY_SCHEDULED_WINDOW)
  ) {
    return {
      active: true,
      type: "scheduled",
      label: DAILY_SCHEDULED_WINDOW.label,
    };
  }

  return {
    active: false,
    type: "none",
    label: "",
  };
}

function shouldSkipPath(pathname) {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }

  if (STATIC_FILE_PATTERN.test(pathname)) {
    return true;
  }

  return STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.searchParams.has(BYPASS_QUERY) || shouldSkipPath(url.pathname)) {
    return undefined;
  }

  const maintenance = getMaintenanceState();

  if (!maintenance.active) {
    return undefined;
  }

  const maintenanceUrl = new URL(MAINTENANCE_PATH, request.url);
  maintenanceUrl.searchParams.set("mode", maintenance.type);
  maintenanceUrl.searchParams.set("label", maintenance.label);

  const response = Response.redirect(maintenanceUrl, 307);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-solaris-maintenance", maintenance.type);

  return response;
}
