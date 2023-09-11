(function (root, factory) {

  module.exports = factory();

}(this, function () {
  return (function () {

    const fs = require('expo-file-system');

    const accessDataDir = async (datadir) => {
      const fileInfo = await fs.getInfoAsync(datadir);
      if (!fileInfo.exists || !fileInfo.isDirectory) {
        throw "Dir does not exist";
      }
      return fileInfo;
    };

    const ensureDirectory = async (fileUri) => {
      await fs.makeDirectoryAsync(fileUri, {intermediates: true});
    }

    const saveRecord = (coll, obj, dir) => {
      console.log(`File is db/${dir}/${coll}/${obj.$loki}.json`);
      const directory = `file://db/${dir}/${coll}`
      ensureDirectory(directory)
        .then(() => {
          fs
            .writeAsStringAsync(`${directory}/${obj.$loki}.json`, JSON.stringify(obj), {encoding: 'utf8'})
            .then(() => console.info("Document saved correctly"))
            .catch(() => console.error("Document save failed"));
        })
    };

    const iterateFolders = (db, dir) => {
      console.log(`Collections: ${db.listCollections().length}`);
      console.log(`Changes: ${db.generateChangesNotification().length}`);
      db.generateChangesNotification().forEach(change => {
        saveRecord(change.name, change.obj, dir);
      });
    };

    class LokiIncrementalAdapter {
      constructor(options) {
        const config = options || {
          journaling: false,
          format: 'json'
        };
        this.mode = 'reference';
        this.journaling = config.journaling;
        this.format = config.format;
      }

      checkAvailability() {
        if (typeof fs !== 'undefined' && fs) return true;
        return false;
      }

      exportDatabase(dir, dbref, callback) {
        console.log('Saving with incremental adapter');

        console.log('Database dir is ' + dir);
        const promise = accessDataDir(dir);
        console.log(promise);
        promise.then(() => {
          console.log('iterating folders...');
          iterateFolders(dbref, dir);
        });
        promise.catch((err) => {
          console.log(err);
        });
        if (callback) {
          callback();
        }
      }

      loadDatabase(dbname, callback) {
        console.log(this, dbname, callback);
      }
    }

    return LokiIncrementalAdapter;

  }());
}));
