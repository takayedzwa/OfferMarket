// Barrel that aggregates every namespace into a single messages object for the
// active locale. To add a namespace: create `<namespace>.json` and add a line
// here. `resolveJsonModule` is enabled in tsconfig.json so JSON imports are typed.
import common from "./common.json";
import nav from "./nav.json";
import auth from "./auth.json";
import offers from "./offers.json";
import workers from "./workers.json";
import profile from "./profile.json";
import dashboard from "./dashboard.json";
import admin from "./admin.json";
import support from "./support.json";
import dsa from "./dsa.json";
import privacy from "./privacy.json";
import errors from "./errors.json";
import notifications from "./notifications.json";
import conversations from "./conversations.json";
import enums from "./enums.json";
import legal from "./legal.json";
import adminList from "./admin-list.json";
import adminDetail from "./admin-detail.json";

const messages = {
  common,
  nav,
  auth,
  offers,
  workers,
  profile,
  dashboard,
  admin,
  "admin-list": adminList,
  "admin-detail": adminDetail,
  support,
  dsa,
  privacy,
  errors,
  notifications,
  conversations,
  enums,
  legal,
};

export default messages;