(function () {
  const params = new URLSearchParams(window.location.search);
  const host = window.location.hostname;
  const localHost = host === "localhost" || host === "127.0.0.1" || host === "";
  let savedOwnerMode = false;

  try {
    if (params.get("owner") === "1") {
      localStorage.setItem("ctf-owner-mode", "1");
    }

    if (params.get("owner") === "0") {
      localStorage.removeItem("ctf-owner-mode");
    }

    savedOwnerMode = localStorage.getItem("ctf-owner-mode") === "1";
  } catch {
    savedOwnerMode = params.get("owner") === "1";
  }

  const enabled = localHost || savedOwnerMode;
  document.body.classList.toggle("is-owner", enabled);
})();
