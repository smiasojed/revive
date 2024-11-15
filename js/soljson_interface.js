mergeInto(LibraryManager.library, {
    soljson_compile: function(inputPtr, inputLen) {
        var inputJson = UTF8ToString(inputPtr, inputLen);
        var output = Module.soljson.cwrap('solidity_compile', 'string', ['string'])(inputJson);
        return stringToNewUTF8(output)
    },
    soljson_version: function() {
        var version = Module.soljson.cwrap("solidity_version", "string", [])();
        return stringToNewUTF8(version)
    },
    resolc_compile: function(inputPtr, inputLen) {
        const { Worker } = require('worker_threads');
        const deasync = require('deasync');

        var inputJson = UTF8ToString(inputPtr, inputLen);
        function compileWithWorker(inputJson, callback) {
            return new Promise((resolve, reject) => {
                // Create a new Worker
                const worker = new Worker('./worker.js');

                // Listen for messages from the worker
                worker.on('message', (message) => {
                    resolve(message.output);  // Resolve the promise with the output
                    callback(null, message.output);
                    worker.terminate(); // Terminate the worker after processing
                });

                // Listen for errors from the worker
                worker.on('error', (error) => {
                    reject(error);
                    callback(error);
                    worker.terminate();
                });

                // Send the input JSON to the worker
                worker.postMessage(inputJson);
            });
        }
        let result = null;
        let error = null;

        // Use deasync to block until promise resolves
        compileWithWorker(inputJson, function (err, res) {
            error = err;
            result = res;
        });
        // TODO: deasync is not present in browsers, another solution needs to be implemented
        deasync.loopWhile(() => result === null && error === null);

        if (error) {
            const errorJson = JSON.stringify({ type: 'error', message: error.message || "Unknown error" });
            return stringToNewUTF8(errorJson)
        }

        const resultJson = JSON.stringify({ type: 'success', data: result });
        return stringToNewUTF8(resultJson);
    },
});