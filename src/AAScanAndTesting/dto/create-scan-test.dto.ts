export class CreateScanTestOptionDto {
  optionName: string;
  type?: string;
  unit: string;
  price?: number;
  reference?: any;
}

export class CreateScanTestDto {
  hospital_Id: number;
  title: string;
  type: string;
  amount?: number;
  options?: CreateScanTestOptionDto[];
}
