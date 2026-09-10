export const getAPIBaseURL = (production: boolean): URL =>
  new URL(production ? "https://api.nekomimi-ramen.com" : "http://localhost:8787");

export const getStaffBaseURL = (production: boolean): URL =>
  new URL(production ? "https://staff.nekomimi-ramen.com" : "http://localhost:5173");

export const getSiteBaseURL = (production: boolean): URL =>
  new URL(production ? "https://nekomimi-ramen.com" : "http://localhost:4321");
