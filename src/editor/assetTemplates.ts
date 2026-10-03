export interface AssetTemplate {
  id: string; // assetId として利用
  label: string;
  category: "Character" | "Furniture" | "Background";
  modelPath?: string; // GLBファイルへのパス（/public 起点）
}

export const assetTemplates: AssetTemplate[] = [
  { id: "nanami", label: "Nanami", category: "Character" },
  { id: "yuka", label: "Yuka", category: "Character" },
  { id: "mitsuishi", label: "Mitsuishi", category: "Character" },
  { id: "desk", label: "Desk", category: "Furniture" },
  { id: "chair", label: "Chair", category: "Furniture" },
  { id: "shelf", label: "Shelf", category: "Furniture" },
  { id: "tree", label: "Tree", category: "Background" },
  { id: "poster", label: "Poster", category: "Background" },
  { id: "vending_machine", label: "VendingMachine", category: "Background" },
  { id: "yukari1", label: "yukari1", category: "Character", modelPath: "/data/models/human/yukari1.glb" },
  { id: "yukari4", label: "yukari4", category: "Character", modelPath: "/data/models/human/yukari_test4.glb" },
  { id: "testTakamiya", label: "testTakamiya", category: "Character", modelPath: "/data/models/human/test_takamiya.glb" },
];