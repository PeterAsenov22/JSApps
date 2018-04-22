let service = (() => {
    function getActiveReceipt(userId) {
        return requester.get('appdata',`receipts?query={"_acl.creator":"${userId}","active": "true"}`,'kinvey');
    }
    
    function getEntriesByReceiptId(receiptId) {
        return requester.get('appdata',`entries?query={"receiptId":"${receiptId}"}`,'kinvey');
    }
    
    function createReceipt() {
        let receiptObj = {
            active: true,
            productCount: 0,
            total: 0
        };
        return requester.post('appdata','receipts','kinvey',receiptObj);
    }
    
    function addEntry(entryObj) {
        return requester.post('appdata','entries','kinvey',entryObj);
    }
    
    function deleteEntry(entryId) {
        return requester.remove('appdata',`entries/${entryId}`,'kinvey');
    }
    
    function commitReceipt(receiptId, receiptObj) {
        return requester.update('appdata',`receipts/${receiptId}`,'kinvey', receiptObj);
    }
    
    function loadMyReceipts(userId) {
        return requester.get('appdata',`receipts?query={"_acl.creator":"${userId}","active":"false"}`,'kinvey');
    }

    function loadReceipt(receiptId) {
        return requester.get('appdata',`receipts/${receiptId}`,'kinvey');
    }

    return{
        getActiveReceipt,
        getEntriesByReceiptId,
        createReceipt,
        addEntry,
        deleteEntry,
        commitReceipt,
        loadMyReceipts,
        loadReceipt
    }
})();