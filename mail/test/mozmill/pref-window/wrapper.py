# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# For test-font-chooser.js we need a few default prefs -- this module does that.

import os
import shutil
import sys

_pref_file_names = {
    "win32": "windows-prefs.js",
    "darwin": "mac-prefs.js",
    "linux2": "linux-prefs.js",
}


def on_profile_created(profiledir):
    """
    On profile creation, this copies *-prefs.js from the current folder to
    profile_dir as a user.js file. These user prefs is interpreted in addition
    to the standard prefs.js file.
    """
    # The pref file is in the same directory this script is in.
    # Fallback to Linux prefs for anything not in the dictionary -- we're
    # assuming that they're other unixes.
    preffile = os.path.join(os.path.dirname(__file__),
                            _pref_file_names.get(sys.platform, "linux-prefs.js"))
    shutil.copy(preffile, os.path.join(profiledir, "user.js"))
