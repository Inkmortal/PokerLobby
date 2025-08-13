impl :: bincode :: Encode for BunchingData
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        :: bincode :: Encode :: encode(&self.fold_ranges, encoder) ?; ::
        bincode :: Encode :: encode(&self.flop, encoder) ?; :: bincode ::
        Encode :: encode(&self.phase, encoder) ?; :: bincode :: Encode ::
        encode(&self.progress_percent, encoder) ?; :: bincode :: Encode ::
        encode(&self.temp_table1, encoder) ?; :: bincode :: Encode ::
        encode(&self.temp_table2, encoder) ?; :: bincode :: Encode ::
        encode(&self.temp_table3, encoder) ?; :: bincode :: Encode ::
        encode(&self.sum, encoder) ?; :: bincode :: Encode ::
        encode(&self.result4, encoder) ?; :: bincode :: Encode ::
        encode(&self.result5, encoder) ?; :: bincode :: Encode ::
        encode(&self.result6, encoder) ?; Ok(())
    }
}