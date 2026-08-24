import { preview } from 'vite';

export default async function startProductionPreview() {
  const server = await preview({
    preview: {
      host: '127.0.0.1',
      port: 4191,
      strictPort: true,
    },
  });

  return async () => {
    await server.close();
  };
}
