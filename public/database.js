let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', 1);

// Create an object store inside the onupgradeneeded method.
request.onupgradeneeded = event => {
    const db = event.target.result;
    db.createObjectStore('BudgetStore', { autoIncrement: true });
};

request.onsuccess = event => {
    console.log('success');
    db = event.target.result

    // Check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

// On error console the result.
request.onerror = event => {
    console.log('Error: ' + event.target.errorCode);
};

function checkDatabase() {
    console.log('check db invoked');

    // Open a transaction on your BudgetStore db
    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // access your BudgetStore object
    const store = transaction.objectStore('BudgetStore');

    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    transaction = db.transaction(['BudgetStore'], 'readwrite');
                    // access your pending object store
                    const currentStore = transaction.objectStore('BudgetStore');
                    // clear all items in your store
                    currentStore.clear();
                    console.log('Clearing store 🧹');
                });
        }
    };
}

const saveRecord = (record) => {
    console.log('Save record invoked');
    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    // Access your BudgetStore object store
    const store = transaction.objectStore('BudgetStore');

    // Add record to your store with add method.
    store.add(record);
};


// listen for app coming back online
window.addEventListener('online', checkDatabase);