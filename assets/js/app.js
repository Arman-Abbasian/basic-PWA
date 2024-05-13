if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function (res) {})
    .catch(function (e) {
      console.log(e.message);
    });
}

// Check browser------------------
navigator.sayswho = () => {
  var N = Navigator.appName,
    ua = navigator.userAgent,
    tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*([\d\.]+)/i);
  if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
  M = M ? [M[1], M[2]] : [N, Navigator.appVersion, "-?"];
  return M.join(" ");
};
//if (!navigator.sayswho().includes("Chrome")) alert("لطفا از مرورگر کروم استفاده کنید")

// install prompt-------------
var deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  if (!window.matchMedia("(display-mode: standalone)").matches) {
    setTimeout(() => {
      document.getElementById("install-prompt")?.classList.add("show");
    }, 5000);
  }
  e.preventDefault();
  deferredPrompt = e;
  return false;
});

// install prompt in ios------------------
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const isInStandaloneMode = () =>
  "standalone" in window.navigator && window.navigator.standalone;

// Checks if should display install popup notification:
if (isIos() && !isInStandaloneMode()) {
  // this.setState({ showInstallMessage: true });
  this.popupIos = true;
}

document.getElementById("install-prompt")?.addEventListener("click", (e) => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    e.target.classList.remove("show");
    deferredPrompt.userChoice.then((choiceRes) => {
      console.log(choiceRes.outcome);
      if (choiceRes.outcome === "accepted") {
        console.log("User accepted the install prompt.");
      } else if (choiceRes.outcome === "dismissed") {
        console.log("User dismissed the install prompt");
      }
    });
    deferredPrompt = null;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll(".sidenav");
  var instances = M.Sidenav.init(elems, {
    edge: "right",
  });
});

// Push notification-------------------

//if the user do not certain the condition about allowance of push notification
if (Notification.permission == "default") {
  setTimeout(() => {
    document
      .getElementById("notification_bell_box")
      ?.classList.remove("dis-none");
  }, 10000);
}

const showConfirmNotify = () => {
  //if service worker registerd
  if ("serviceWorker" in navigator) {
    //when serviceworker was ready
    navigator.serviceWorker.ready.then((sw) => {
      sw.showNotification("ممنون از شما...!");
      sw.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            "BNbqX8M5NJJfs_IcL_5Gfisx7FkOYHtYniD4QMJq1RB4DeQsOmGo3lO-zzurFEqTUwtrqQHKb62p_TzxPU552yI",
        })
        .then((subscription) => {
          fetch("https://pushnotif.azhadev.ir/api/push-subscribe", {
            method: "post",
            body: JSON.stringify(subscription),
          })
            .then((res) => {
              return res.json();
            })
            .then((response) => {
              console.log(response);
              alert("این کد رو ذخیره کنید : " + response.user_code);
            });
        });
    });
  }
};

//this handler is related to click on bell icon for accept or reject-
//nofitication allowance
document
  .getElementById("notification_bell_box")
  ?.addEventListener("click", () => {
    //this method get the option that user choosed in browser nofit pop-up
    Notification.requestPermission((res) => {
      if (res == "granted") {
        showConfirmNotify();
      } else {
        console.log("Blocked...!");
      }
    });
  });

// network status------------------------

const setnetworkStatus = (status) => {
  const iconElem = document.querySelector("#network_status i");
  if (status == 1) {
    iconElem?.classList.add("green-text");
    iconElem?.classList.remove("red-text");
  } else {
    iconElem?.classList.remove("green-text");
    iconElem?.classList.add("red-text");
  }
};

if (navigator.onLine) setnetworkStatus(1);
else setnetworkStatus(0);

window.addEventListener("online", () => setnetworkStatus(1));
window.addEventListener("offline", () => setnetworkStatus(0));
