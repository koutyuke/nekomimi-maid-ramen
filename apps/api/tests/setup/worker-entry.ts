// DEC-SYS-005
export default {
  fetch: () => new Response(null, { status: 501 }),
} satisfies ExportedHandler;
