import QRCode from "qrcode";

export const QRCodeGenerator = {
  /**
   * Gera uma imagem Base64 do QR Code para ser exibida na tag <img> ou enviada para impressora térmica.
   * @param pieceId O ID único ou código da peça
   * @param baseUrl A URL base do sistema (ex: https://app.ararasmoda.com)
   */
  async generateForPiece(pieceId: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"): Promise<string> {
    try {
      // A URL que será aberta quando o celular escanear o código
      const scanUrl = `${baseUrl}/inventory/${pieceId}`;

      // Gera a imagem em Base64
      const qrCodeBase64 = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000", // Cor dos quadrados (Preto)
          light: "#FFFFFF", // Cor do fundo (Branco)
        },
      });

      return qrCodeBase64;
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      throw new Error("Falha na geração do QR Code da peça.");
    }
  },
};