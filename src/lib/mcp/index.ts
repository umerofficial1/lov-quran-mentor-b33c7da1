import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchSurahs from "./tools/search-surahs";
import getAyah from "./tools/get-ayah";
import listBookmarks from "./tools/list-bookmarks";
import addBookmark from "./tools/add-bookmark";
import getHifzProgress from "./tools/hifz-progress";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud
// proxy). Read the project ref from the Vite-inlined env, with a harmless
// fallback for the manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "love-qran-mcp",
  title: "Love Qran",
  version: "0.1.0",
  instructions:
    "Tools for the Love Qran Islamic learning app. Search surahs and fetch ayahs (public), or read and add the signed-in user's bookmarks and Hifz memorization progress (requires OAuth).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchSurahs, getAyah, listBookmarks, addBookmark, getHifzProgress],
});
