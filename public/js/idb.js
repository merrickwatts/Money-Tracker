let db;
const request = indexedDB.open("money_tracker", 1);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  db.createObjectStore("new_trans", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    // we haven't created this yet, but we will soon, so let's comment it out for now
    uploadTrans();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_trans"], "readwrite");

  // access the object store
  const objectStore = transaction.objectStore("new_trans");

  // add record to your store with add method
  objectStore.add(record);
}

function uploadTrans() {
  // open a transaction on your db
  const transaction = db.transaction(["new_trans"], "readwrite");

  // access your object store
  const objectStore = transaction.objectStore("new_trans");

  // get all records from store and set to a variable
  const getAll = objectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_trans"], "readwrite");
          const objectStore = transaction.objectStore("new_trans");
          objectStore.clear();

          alert("All saved transactions has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadTrans);
