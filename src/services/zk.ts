import axios from "axios";

const API_URL = "/api/zk";

export const zkService = {
  async generateInputs(userId: string) {
    const response = await axios.post(`${API_URL}/generate-inputs`, {
      user_id: userId,
    });
    return response.data;
  },

  async submitProof(userId: string, proof: Uint8Array, publicInputs: Uint8Array[]) {
    const response = await axios.post(`${API_URL}/submit-proof`, {
      user_id: userId,
      proof: Array.from(proof), // Convert Uint8Array to array for JSON serialization
      public_inputs: publicInputs.map((input) => Array.from(input)),
    });
    return response.data;
  },
};
