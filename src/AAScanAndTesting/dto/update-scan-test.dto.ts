export class UpdateScanTestOptionDto {
  id?: number; // if present → update, else → create
  optionName: string;
  type?: string;
  unit: string;
  price?: number;
  reference?: any;
}

export class UpdateScanTestDto {
  title?: string;
  type?: string;
  amount?: number;
  options?: UpdateScanTestOptionDto[];
}
