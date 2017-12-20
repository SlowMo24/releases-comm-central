/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/**
 * Extra tests for SMTP passwords (forgetPassword)
 */

Components.utils.import("resource://gre/modules/Services.jsm");

load("../../../resources/passwordStorage.js");

var kUser1 = "testsmtp";
var kUser2 = "testsmtpa";
var kProtocol = "smtp";
var kHostname = "localhost";
var kServerUrl = kProtocol + "://" + kHostname;

add_task(function *() {
  // Prepare files for passwords (generated by a script in bug 1018624).
  yield setupForPassword("signons-mailnews1.8-multiple.json")

  // Set up the basic accounts and folders.
  localAccountUtils.loadLocalMailAccount();

  var smtpServer1 = getBasicSmtpServer();
  var smtpServer2 = getBasicSmtpServer();

  smtpServer1.authMethod = 3;
  smtpServer1.username = kUser1;
  smtpServer2.authMethod = 3;
  smtpServer2.username = kUser2;

  var i;
  var count = {};

  // Test - Check there are two logins to begin with.
  let logins = Services.logins.findLogins(count, kServerUrl, null, kServerUrl);

  Assert.equal(count.value, 2);

  // These will either be one way around or the other.
  if (logins[0].username == kUser1) {
    Assert.equal(logins[1].username, kUser2);
  } else {
    Assert.equal(logins[0].username, kUser2);
    Assert.equal(logins[1].username, kUser1);
  }

  // Test - Remove a login via the incoming server
  smtpServer1.forgetPassword();

  logins = Services.logins.findLogins(count, kServerUrl, null, kServerUrl);

  // should be one login left for kUser2
  Assert.equal(count.value, 1);
  Assert.equal(logins[0].username, kUser2);

  // Test - Remove the other login via the incoming server
  smtpServer2.forgetPassword();

  logins = Services.logins.findLogins(count, kServerUrl, null, kServerUrl);

  // There should be no login left.
  Assert.equal(count.value, 0);
  Assert.equal(logins.length, 0);
});

function run_test() {
  run_next_test();
}
