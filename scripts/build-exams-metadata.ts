import fs from "fs";
import { MANUAL_OVERRIDES, CG_ENRICHMENT_MAP } from "./exam-overrides";

const CATEGORY_MAP: Record<string, string> = {
  "Số học & Số tự nhiên": "soh",
  "Hình học": "hinh",
  "Phân số, Tỉ số & %": "phan",
  "Chuyển động": "cd",
  "Suy luận logic": "log",
  "Đo lường & Đổi đơn vị": "do",
  "Biểu đồ, Thống kê & Xác suất": "xs",
  "Toán tuổi": "tuoi",
  "Đại lượng tỉ lệ & Bản đồ": "ti",
  "Thời gian (giờ - phút)": "tg"
};

const SCHOOLS = [
  { code: "CG", dbCode: "cg", name: "Cầu Giấy" },
  { code: "TX", dbCode: "tx", name: "Thanh Xuân" },
  { code: "LTV", dbCode: "ltv", name: "Lương Thế Vinh" },
  { code: "NTT", dbCode: "ntt", name: "Nguyễn Tất Thành" },
  { code: "NN", dbCode: "nn", name: "Ngoại ngữ" },
  { code: "NTL", dbCode: "ntl", name: "Nam Từ Liêm" },
  { code: "NSHN", dbCode: "nshn", name: "Ngôi Sao Hà Nội" },
  { code: "NSHM", dbCode: "nshm", name: "Ngôi Sao Hoàng Mai" }
];


function getSections(schoolCode: string, yearStr: string): any[] {
  const normSchool = schoolCode.toLowerCase();
  const startYear = yearStr.split("-")[0];

  if (normSchool === "cg") {
    if (startYear === "2019" || startYear === "2020" || startYear === "2021") {
      return [
        { num: 1, header: "PHẦN 1: Học sinh chỉ viết đáp số vào ô trống bên phải" },
        { num: 9, header: "PHẦN 2: Bài tập học sinh phải trình bày lời giải" }
      ];
    } else if (startYear === "2022") {
      return [
        { num: 1, header: "PHẦN 1: Trắc nghiệm" },
        { num: 5, header: "PHẦN 2: Điền đáp số" },
        { num: 9, header: "PHẦN 3: Tự luận" }
      ];
    } else if (startYear === "2023") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM CHỌN ĐÁP ÁN ĐÚNG" },
        { num: 5, header: "PHẦN II: TRẮC NGHIỆM ĐIỀN ĐÁP SỐ" },
        { num: 9, header: "PHẦN III: TỰ LUẬN" }
      ];
    } else if (startYear === "2024") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM ĐIỀN ĐÁP SỐ" },
        { num: 9, header: "PHẦN II: TỰ LUẬN" }
      ];
    } else if (startYear === "2025") {
      return [
        { num: 1, header: "PHẦN A: TRẮC NGHIỆM - I. Khoanh vào chữ đặt trước câu trả lời đúng" },
        { num: 5, header: "PHẦN A: TRẮC NGHIỆM - II. Điền đáp số vào ô trả lời tương ứng với mỗi câu hỏi" },
        { num: 9, header: "PHẦN B: TỰ LUẬN" }
      ];
    } else if (startYear === "2026") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM" },
        { num: 5, header: "PHẦN II: ĐIỀN ĐÁP ÁN" },
        { num: 9, header: "PHẦN III: TỰ LUẬN" }
      ];
    }
  } else if (normSchool === "ntt") {
    if (startYear === "2025") {
      return [
        { num: 1, header: "A. TRẮC NGHIỆM - I. Khoanh vào chữ đặt trước câu trả lời đúng (Mỗi câu đúng được 0,5 điểm)" },
        { num: 9, header: "II. Điền đáp số vào ô trả lời tương ứng với mỗi câu hỏi (Mỗi câu đúng được 0,75 điểm)" },
        { num: 13, header: "B. TỰ LUẬN (3,0 điểm)" }
      ];
    }
  } else if (normSchool === "ntl") {
    if (startYear === "2020") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM ĐIỀN ĐÁP ÁN" },
        { num: 11, header: "PHẦN II: TỰ LUẬN" }
      ];
    } else if (startYear === "2022") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM ĐIỀN ĐÁP ÁN" },
        { num: 12, header: "PHẦN II: TỰ LUẬN" }
      ];
    } else if (startYear === "2023") {
      return [
        { num: 1, header: "PHẦN I: TRẮC NGHIỆM ĐIỀN ĐÁP ÁN" },
        { num: 11, header: "PHẦN II: TỰ LUẬN" }
      ];
    } else if (startYear === "2025") {
      return [
        { num: 1, header: "Phần I: Trắc nghiệm" },
        { num: 10, header: "Phần II: Tự luận" }
      ];
    }
  } else if (normSchool === "nshn") {
    if (startYear === "2021") {
      return [
        { num: 1,  header: "I. Phần trắc nghiệm (10 điểm). Học sinh chỉ ghi đáp số vào phiếu trả lời, không cần giải thích" },
        { num: 11, header: "Phần II (5 điểm). Phần tự luận: Học sinh trình bày bài giải chi tiết vào phiếu trả lời" }
      ];
    } else if (startYear === "2022") {
      return [
        { num: 1,  header: "I. TRẮC NGHIỆM (5,0 điểm): Học sinh ghi đáp án vào giấy thi, không cần giải thích" },
        { num: 11, header: "II. TỰ LUẬN (5,0 điểm): Học sinh trình bày bài giải chi tiết vào giấy thi" }
      ];
    } else if (startYear === "2026") {
      return [
        { num: 1, header: "I. TRẮC NGHIỆM: Học sinh chỉ ghi đáp án vào giấy thi, không cần giải thích" },
        { num: 10, header: "II. TỰ LUẬN: Học sinh trình bày bài giải chi tiết vào giấy thi" }
      ];
    }
  } else if (normSchool === "nshm") {
    if (startYear === "2026") {
      return [
        { num: 1,  header: "I. TRẮC NGHIỆM: Học sinh chỉ ghi đáp án vào giấy thi, không cần giải thích" },
        { num: 11, header: "II. TỰ LUẬN: Học sinh trình bày bài giải chi tiết vào giấy thi" }
      ];
    }
  } else if (normSchool === "nn") {
    if (startYear === "2019") {
      return [
        { num: 1, header: "Phần 1: Trắc nghiệm" },
        { num: 7, header: "Phần 2: Tự luận" }
      ];
    } else if (startYear === "2021") {
      return [];
    } else if (startYear === "2022") {
      return [
        { num: 1, header: "Phần 1: Điền đáp số" },
        { num: 6, header: "Phần 2: Tự luận" }
      ];
    }
  }
  return [];
}

function main() {
  const rawBaseData = fs.readFileSync("official_exams_metadata.json", "utf8");
  const baseJson = JSON.parse(rawBaseData);
  const baseExams = baseJson.exams || [];

  const finalExams = [];

  for (const oldExam of baseExams) {
    const questions = oldExam.questions.map((q: any) => {
      const enrichment = CG_ENRICHMENT_MAP[q.id] || MANUAL_OVERRIDES[q.id] || {};
      
      return {
        id: q.id,
        num: q.num,
        type: q.type,
        topic: q.topic,
        grade: q.grade,
        points: q.points,
        correct: enrichment.correct !== undefined ? enrichment.correct : q.correct,
        unit: enrichment.unit !== undefined ? enrichment.unit : q.unit,
        figure: enrichment.figure !== undefined ? enrichment.figure : q.figure
      };
    });

    finalExams.push({
      id: oldExam.id,
      school: oldExam.school,
      kind: oldExam.kind,
      year: oldExam.year,
      title: oldExam.title,
      intro: oldExam.intro,
      minutes: oldExam.minutes,
      note: oldExam.note,
      sections: oldExam.sections,
      questions
    });
  }

  // Save metadata-only json
  fs.writeFileSync(
    "official_exams_metadata.json",
    JSON.stringify({ exams: finalExams }, null, 2),
    "utf8"
  );
  console.log(`Successfully generated metadata-only official_exams_metadata.json with ${finalExams.length} exams.`);
}

main();
