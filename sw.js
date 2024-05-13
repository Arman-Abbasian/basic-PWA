importScripts("/assets/js/idb.js");
importScripts("/assets/js/idbUtils.js");

//list of static caches(we derived that from dependencies in index.html file)
let staticItems = [
  "/",
  "/index.html",
  "/offline.html",
  "/assets/materialize/css/materialize.min.css",
  "/assets/css/util.css",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "/assets/css/style.css",
  "/assets/js/idb.js",
  "/assets/js/idbUtils.js",
  "/assets/js/alpineJsContollers/usersController.js",
  "/assets/materialize/js/materialize.min.js",
  "/assets/js/app.js",
  "https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2",
];

//we use from variable for names of caches to change them easier in the future
//also for changing the version
let STATIC_CACHE = "static-v2";
let DYNAMIC_CACHE = "dynamic";

//this method is for removing exsesive chache(we write it ourself)
//for example: we said we must have 5 item in chache

const trimCache = (chachName, max) => {
  caches.open(chachName).then((cache) => {
    //keys=> list of cache names as array=>[Request, Request, Request, Request, Request]
    return cache.keys().then((keys) => {
      //if the length of caches was more than limitaion
      if (keys.length > max) {
        //delete the first one in array
        cache.delete(keys[0]).then(() => {
          //and again run the method(thid method continue until num of cahches reach to limitaion)
          trimCache(chachName, max);
        });
      }
    });
  });
};

// install event -------------------------------------->>
//we add to static caches in install level
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      cache.addAll(staticItems);
    })
  );
});

// activate event ------------------------------------>>
self.addEventListener("activate", function (e) {
  e.waitUntil(
    //this method is for managing the versions of caches and delete the old caches
    caches.keys().then((keys) => {
      console.log(keys);
      return Promise.all(
        keys.map((key) => {
          if (key != STATIC_CACHE && key != DYNAMIC_CACHE) {
            console.log("Deleting Cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// fetch event -------------------------------------->>
self.addEventListener("fetch", function (e) {
  //if the url of the caches was a ajax type
  //use from fetch only strategy
  if (
    e.request.url.indexOf("https://jsonplaceholder.typicode.com/users") > -1
  ) {
    e.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(e.request).then((response) => {
          trimCache(DYNAMIC_CACHE, 10);
          cache.put(e.request, response.clone());
          return response;
        });
      })
    );
    //else use from chache first strategy
  } else {
    e.respondWith(
      //if the fetched item was inadvanced in cache list
      caches.match(e.request).then((res) => {
        return (
          res ||
          fetch(e.request)
            .then((fetchRes) => {
              return caches.open(DYNAMIC_CACHE).then((cache) => {
                trimCache(DYNAMIC_CACHE, 10);
                cache.put(e.request, fetchRes.clone());
                return fetchRes;
              });
            })
            //if we did not have that item in our cache and also we have not internet to fetch it
            //if the kinds of item is 'text/html' => show the offline.html file to user
            .catch((err) => {
              return caches.open(STATIC_CACHE).then((cache) => {
                if (e.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            })
        );
      })
    );
  }
});

// notification -------------------------------

//this event is when we show a notif to user and user click on-
//the options in notification
self.addEventListener("notificationclick", (event) => {
  if (event.action == "confirm") {
    console.log("اکشن مورد نظر تایید شد...!");
  } else if (event.action == "cancel") {
    event.notification.close();
    console.log("اکشن مورد نظر نادیده گرفته شد...!");
  } else {
    event.waitUntil(clients.openWindow(event.notification.data.notifUrl));
    console.log("اکشنی انتخاب نشد...!");
  }
});

//when user click on * button to close the notification
self.addEventListener("notificationclose", (event) => {
  console.log("notification closed...!");
});

//this event is related to push a new notification
self.addEventListener("push", (event) => {
  const notification = event.data.json();
  const options = {
    body: notification.body,
    icon: "/assets/images/codeyadIcon.png",
    image: "/assets/images/office.jpg",
    dir: "ltr",
    vibrate: [100, 50, 200],
    badge: "/assets/images/codeyadIcon.png",
    //you can make group for each category of your notification
    tag: "group1",
    //when you send a notification then the user system make a vibrate
    //when you send a false notif and again revise it and send a new one
    //the user system again make a vibrate
    renotify: true,
    //this is related to the button that make eccessive actions and we manage them in -
    //notificationclick event
    actions: [
      { action: "confirm", title: "تایید", icon: "/assets/images/confirm.png" },
      { action: "cancel", title: "انصراف", icon: "/assets/images/cancel.png" },
    ],
    data: {
      notifUrl: notification.url,
    },
  };
  //this method handle the Appearance of notification
  self.registration.showNotification(notification.title, options);
});

// background sync -------------------
const thisSw = self;
self.addEventListener("sync", (event) => {
  console.log("Background sync event started...", event);
  if (event.tag == "syncPostData") {
    console.log("Sync post data started...");
    readAllData("postDataStore").then((data) => {
      for (const d of data) {
        fetch("https://jsonplaceholder.typicode.com/users", {
          method: "POST",
          body: JSON.stringify(d),
        })
          .then((res) => res.json())
          .then(() => {
            deleteOneData("postDataStore", d.id).then(() => {
              console.log(d.id, "deleted...");
              thisSw.registration.showNotification("ارسال اطلاعات انجام شد");
            });
          });
      }
    });
  }
});
