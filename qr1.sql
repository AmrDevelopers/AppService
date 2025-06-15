SELECT 
  id,
  certificate_number,
  SUBSTRING_INDEX(certificate_number, '-', -1) as sequence_part,
  LENGTH(SUBSTRING_INDEX(certificate_number, '-', -1)) as sequence_length
FROM certificates
WHERE LENGTH(SUBSTRING_INDEX(certificate_number, '-', -1)) > 2;