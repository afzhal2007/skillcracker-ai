function getStoredUser() {
  const stored = localStorage.getItem("skillcracker_user");
  if (!stored) return { isLoggedIn: false };
  try {
    return JSON.parse(stored);
  } catch {
    return { isLoggedIn: false };
  }
}

function isProtectedNavigationAllowed() {
  const user = getStoredUser();
  return user.isLoggedIn === true;
}

function handleProtectedLinkClick(event) {
  const link = event.currentTarget;
  const href = link.getAttribute("href") || "dashboard.html";

  if (href.startsWith("#")) {
    return;
  }

  if (!isProtectedNavigationAllowed()) {
    event.preventDefault();
    localStorage.setItem("skillcracker_redirect_after_login", href);
    window.location.href = "login.html";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".protected-link").forEach((link) => {
    link.addEventListener("click", handleProtectedLinkClick);
  });
});
