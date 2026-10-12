import unittest
import io
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from services import FraudDetectionService

class TestFraudDetectionService(unittest.TestCase):
    def setUp(self):
        self.service = FraudDetectionService()

    def test_empty_file_handling(self):
        res = self.service.analyze_file("empty.csv", b"")
        self.assertIn("error", res)

    def test_valid_csv_analysis(self):
        csv_data = (
            "txId,class,time_step,amount,fee\n"
            "tx_101,1,40,12.5,0.05\n"
            "tx_102,0,40,1.2,0.01\n"
            "tx_103,1,40,8.4,0.04\n"
            "tx_104,0,40,0.5,0.01\n"
        ).encode('utf-8')
        res = self.service.analyze_file("sample.csv", csv_data)
        self.assertEqual(res["total_nodes"], 4)
        self.assertEqual(res["illicit"], 2)
        self.assertEqual(res["licit"], 2)
        self.assertTrue(res["confidence"] > 50.0)

    def test_unlabeled_data(self):
        csv_data = (
            "txId,amount,fee\n"
            "tx_201,10.0,0.02\n"
            "tx_202,5.0,0.01\n"
        ).encode('utf-8')
        res = self.service.analyze_file("unlabeled.csv", csv_data)
        self.assertEqual(res["total_nodes"], 2)
        self.assertIn("time_series", res)

if __name__ == '__main__':
    unittest.main()
