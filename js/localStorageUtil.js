// Currently based on session storage for testing

class LocalStorageUtil {
  static appendValueToArrayInStore(arrayKey, valToAppend) {
    let arrayObj = JSON.parse(LocalStorageUtil.getItemInStore(arrayKey));
    arrayObj.push(valToAppend);
    LocalStorageUtil.setItemInStore(arrayKey, JSON.stringify(arrayObj));
  }

  static setItemInStore(key, value) {
    if (!isSessionStorageAvailable) return;

    window.sessionStorage.setItem(key, value);
  }

  static getItemInStore(key) {
    if (!isSessionStorageAvailable) return null;

    return window.sessionStorage.getItem(key);
  }

  static storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
  }
}

let isSessionStorageAvailable = false;

if (LocalStorageUtil.storageAvailable('sessionStorage')) {
  isSessionStorageAvailable = true;
}
