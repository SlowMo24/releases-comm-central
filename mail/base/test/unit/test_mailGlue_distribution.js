Components.utils.import("resource:///modules/distribution.js");
Components.utils.import("resource://gre/modules/Services.jsm");

function run_test()
{
  do_test_pending();

  Services.locale.setRequestedLocales(["en-US"]);

  // Create an instance of nsIFile out of the current process directory
  let distroDir = Services.dirsvc.get("XCurProcD", Ci.nsIFile);

  // Construct a descendant of the distroDir file
  distroDir.append("distribution");

  // Create a clone of distroDir
  let iniFile = distroDir.clone();

  // Create a descendant of iniFile
  iniFile.append("distribution.ini");
  // It's a bug if distribution.ini already exists
  if (iniFile.exists()) {
    do_throw("distribution.ini already exists in objdir/mozilla/dist/bin/distribution.");
  }

  do_register_cleanup(function() {
    // Remove the distribution.ini file
    let iniFile = Services.dirsvc.get("XCurProcD", Ci.nsIFile);
    iniFile.append("distribution");
    iniFile.append("distribution.ini");
    if (iniFile.exists())
      iniFile.remove(true);
  });

  let testDir = Services.dirsvc.get("CurWorkD", Ci.nsIFile);
  let testDistributionFile = testDir.clone();

  // Construct descendant file
  testDistributionFile.append("distribution.ini");
  // Copy to distroDir
  testDistributionFile.copyTo(distroDir, "distribution.ini");
  Assert.ok(testDistributionFile.exists());

  // Set the prefs
  TBDistCustomizer.applyPrefDefaults();

  let testIni = Cc["@mozilla.org/xpcom/ini-parser-factory;1"]
                  .getService(Ci.nsIINIParserFactory)
                  .createINIParser(testDistributionFile);

  // Now check that prefs were set - test the Global prefs against the
  // Global section in the ini file
  let iniValue = testIni.getString("Global", "id");
  let pref = Services.prefs.getCharPref("distribution.id");
  Assert.equal(iniValue, pref);

  iniValue = testIni.getString("Global", "version");
  pref = Services.prefs.getCharPref("distribution.version");
  Assert.equal(iniValue, pref);

  let aboutLocale;
  try {
    aboutLocale = testIni.getString("Global", "about.en-US");
  }
  catch (e) {
    Components.utils.reportError(e);
  }

  if (aboutLocale == undefined)
    aboutLocale = testIni.getString("Global", "about");

  pref = Services.prefs.getCharPref("distribution.about");
  Assert.equal(aboutLocale, pref);

  // Test Preferences section
  let s = "Preferences";
  let keys = testIni.getKeys(s);
  while (keys.hasMore()) {
    let key = keys.getNext();
    let value = eval(testIni.getString(s, key));
    switch (typeof value) {
    case "boolean":
        Assert.equal(value, Services.prefs.getBoolPref(key));
        break;
    case "number":
        Assert.equal(value, Services.prefs.getIntPref(key));
        break;
    case "string":
        Assert.equal(value, Services.prefs.getCharPref(key));
        break;
    default:
        do_throw("The preference " + key + " is of unknown type: " + typeof value);
    }
  }

  // Test the LocalizablePreferences-[locale] section
  // Add any prefs found in it to the overrides array
  let overrides = [];
  s = "LocalizablePreferences-en-US";
  keys = testIni.getKeys(s);
  while (keys.hasMore()) {
    let key = keys.getNext();
    let value = eval(testIni.getString(s, key));
    value = "data:text/plain," + key + "=" + value;
    Assert.equal(value, Services.prefs.getCharPref(key));
    overrides.push(key);
  }

  // Test the LocalizablePreferences section
  // Any prefs here that aren't found in overrides are not overriden
  //   by LocalizablePrefs-[locale] and should be tested
  s = "LocalizablePreferences";
  keys = testIni.getKeys(s);
  while (keys.hasMore()) {
    let key = keys.getNext();
    if (!overrides.includes(key)) {
      let value = eval(testIni.getString(s, key));
      value =  value.replace(/%LOCALE%/g, "en-US");
      value = "data:text/plain," + key + "=" + value;
      Assert.equal(value, Services.prefs.getCharPref(key));
    }
  }
  do_test_finished();
}
