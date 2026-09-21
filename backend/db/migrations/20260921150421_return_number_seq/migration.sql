-- Sequence for human-readable return numbers (RET-YYYY-NNNN).
-- Prisma can't declare standalone sequences in schema.prisma, so it lives here.
-- nextval() is atomic, so concurrent submissions never get the same number.
CREATE SEQUENCE "return_request_number_seq";
