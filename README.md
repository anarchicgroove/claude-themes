# claude-themes 🌸

Pretty CSS themes for [claude.ai](https://claude.ai) — soft palettes, custom fonts, and message bubbles that don't look like everyone else's.

No coding needed. You install one browser extension, click one link, and your Claude looks different.

---

## Which file do I need?

There are two versions of every theme. Pick based on **which extension you're using**, not which phone you have.

| | **Stylus** | **Userscripts** |
|---|---|---|
| **Works on** | Firefox & Chrome on desktop, Firefox on Android | Safari on iPhone, iPad, and Mac |
| **You want the file ending in** | `.user.css` | `.user.js` |
| **Extras** | Core theme | Full version — also styles markdown *inside your own messages* |

Both give you the same look. The Safari version just does a little bit more, because Userscripts can run JavaScript and Stylus can't.

---

## Themes

### 🍓 Strawberry Clouds

A soft pink light theme. Pastel pink, peach and cream, a faintly sparkling background, glassy menus, and cloud-shaped message bubbles for everything you send. Built to be gentle on the eyes and light on battery.

![Strawberry Clouds](strawberry-clouds/preview.png)

**Install →** [Stylus version](https://raw.githubusercontent.com/anarchicgroove/claude-themes/main/strawberry-clouds/strawberry-clouds.user.css) · [Userscripts version](https://github.com/anarchicgroove/claude-themes/blob/main/strawberry-clouds/strawberry-clouds.user.js)

---

## How to install

<details>
<summary><b>💻 Stylus — Firefox or Chrome on desktop</b></summary>

1. Open your browser's add-on store and search for **Stylus**. Install it.
   *(Careful — there's an older extension called **Stylish** with a similar name. You want Stylus.)*
2. Click the **Stylus version** link for the theme you want, above.
3. Stylus will open its own install page showing the theme's name and details. Click **Install style**.
4. Reload claude.ai. Done. 🎉

To turn it off later, click the Stylus icon in your toolbar and toggle the theme off.

</details>

<details>
<summary><b>📱 Firefox on Android</b></summary>

Same as the desktop steps — Firefox for Android supports add-ons, so Stylus works there too.

1. Install **Firefox** from the Play Store if you don't have it.
2. In Firefox, open the **⋮** menu → **Add-ons** → find and install **Stylus**.
3. Tap the **Stylus version** link for the theme you want, above.
4. Tap **Install style** when Stylus offers.
5. Reload claude.ai.

*Heads up: I don't own an Android device, so these steps are written from documentation rather than tested by hand. If something's off, open an issue and tell me what you saw — I'll fix it.*

</details>

<details>
<summary><b>🍎 Userscripts — Safari on iPhone, iPad, or Mac</b></summary>

This one has a few more steps, because Safari extensions read scripts out of a folder on your device.

**First-time setup (only once, ever):**

1. Install **Userscripts** from the App Store. It's free.
2. Open the Userscripts app and set a **scripts directory** — it'll walk you through picking or making a folder. Remember where you put it.
3. Open Safari → tap the **ᴀA** icon in the address bar → **Manage Extensions** → turn on **Userscripts**.
4. Tap **ᴀA** again → **Userscripts** → set claude.ai to **Always Allow**.

**Then, to add a theme:**

5. Tap the **Userscripts version** link for the theme you want, above.
6. On that GitHub page, tap the **⋯** menu → **Raw file content** → **Download**.
7. Open the **Files** app → **Downloads** → press and hold the downloaded file → **Move** → put it in your Userscripts folder.
8. Reload claude.ai. 🎉

To turn it off later, open the Userscripts app and toggle the theme off.

</details>

---

## Notes

- These themes are designed around the **mobile** claude.ai layout, so they look their best on a phone. They work on desktop too, just with more empty space at the edges.
- If a pale theme looks washed out or nearly white on a desktop monitor, check your **monitor's contrast setting** before blaming the theme — a contrast of 100 clips light colours to pure white and flattens the whole palette. Turning it down to around 50 usually brings everything back.
- Claude's own interface changes from time to time. If a theme suddenly looks half-broken, that's usually why — open an issue and I'll take a look.

---

## Making your own

Every theme in here is a plain text file. Open one, change the hex codes at the top, and you've got your own. That's genuinely all most of it is.

---

Themes by **neb**, built in collaboration with Claude.
Released under the [MIT License](LICENSE) — use them, change them, share them.
